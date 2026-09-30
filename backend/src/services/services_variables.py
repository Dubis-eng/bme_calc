from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from src.db.database import (
    Variable, Equation, Sector,
    VariableType, VariableStatus, Stage, ControlPoint, HarvestPlanOrderedItem
)
from src.services.services_variables_helpers import (
    _update_variable_equation,
    _resolve_control_point,
    _sync_variable_harvest_grouping
)


def _format_variable_response(
    db_var: Variable,
    db_cp: ControlPoint,
    etapa_str: str,
    pc_str: str,
    eq_val: str,
    grouping: Optional[str]
) -> Dict[str, Any]:
    tipo_val = db_var.tipo.value if hasattr(db_var.tipo, 'value') else str(db_var.tipo)
    status_val = db_var.status.value if hasattr(db_var.status, 'value') else str(db_var.status)
    return {
        "id": db_var.id,
        "nome": db_var.nome,
        "descricao": db_var.descricao,
        "setor_id": db_var.setor_id,
        "tipo": tipo_val,
        "unidade": db_var.unidade,
        "status": status_val,
        "etapa": etapa_str or "GERAL",
        "ponto_controle": pc_str or "GERAL",
        "control_point_id": db_var.control_point_id,
        "stage_id": db_cp.stage_id,
        "ordem": db_var.ordem,
        "equation_value": eq_val,
        "casas_decimais": db_var.casas_decimais,
        "tipo_exibicao": db_var.tipo_exibicao,
        "percent_base": db_var.percent_base,
        "in_harvest_plan": db_var.in_harvest_plan,
        "harvest_plan_op": db_var.harvest_plan_op,
        "harvest_plan_weight_var_id": db_var.harvest_plan_weight_var_id,
        "agrupamento": grouping
    }


def list_variables(db: Session) -> List[Dict[str, Any]]:
    stmt = (
        select(Variable)
        .where(Variable.status != VariableStatus.INATIVA)
        .outerjoin(ControlPoint, Variable.control_point_id == ControlPoint.id)
        .outerjoin(Stage, ControlPoint.stage_id == Stage.id)
        .outerjoin(Sector, Variable.setor_id == Sector.id)
        .order_by(Sector.ordem, Stage.ordem, ControlPoint.ordem, Variable.ordem)
    )
    db_vars = db.exec(stmt).all()
    
    stages = db.exec(select(Stage)).all()
    cps = db.exec(select(ControlPoint)).all()
    stage_map = {s.id: s for s in stages}
    cp_map = {cp.id: cp for cp in cps}
    
    eqs = db.exec(select(Equation).where(Equation.status == "ativa")).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in eqs}

    ordered_items = db.exec(select(HarvestPlanOrderedItem).order_by(HarvestPlanOrderedItem.ordem.asc())).all()
    current_group = None
    var_grouping_map = {}
    for item in ordered_items:
        if item.tipo == "divider":
            current_group = item.label
        elif item.tipo == "variable" and item.variable_id:
            var_grouping_map[item.variable_id] = current_group
    
    vars_list = []
    for var in db_vars:
        eq_val = eq_map.get(var.id, "")
        etapa_name = ""
        cp_name = ""
        stage_id = None
        if var.control_point_id:
            cp_obj = cp_map.get(var.control_point_id)
            if cp_obj:
                cp_name = cp_obj.nome
                stage_id = cp_obj.stage_id
                stage_obj = stage_map.get(cp_obj.stage_id)
                if stage_obj:
                    etapa_name = stage_obj.nome
        if not etapa_name:
            etapa_name = var.etapa or ""
        if not cp_name:
            cp_name = var.ponto_controle or ""
            
        vars_list.append({
            "id": var.id,
            "nome": var.nome,
            "descricao": var.descricao,
            "setor_id": var.setor_id,
            "tipo": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "unidade": var.unidade,
            "status": var.status.value if hasattr(var.status, 'value') else str(var.status),
            "etapa": etapa_name,
            "ponto_controle": cp_name,
            "control_point_id": var.control_point_id,
            "stage_id": stage_id,
            "ordem": var.ordem,
            "equation_value": eq_val,
            "casas_decimais": var.casas_decimais,
            "tipo_exibicao": var.tipo_exibicao,
            "percent_base": var.percent_base,
            "in_harvest_plan": var.in_harvest_plan,
            "harvest_plan_op": var.harvest_plan_op,
            "harvest_plan_weight_var_id": var.harvest_plan_weight_var_id,
            "agrupamento": var_grouping_map.get(var.id)
        })
    return vars_list


def create_variable(req, db: Session) -> Dict[str, Any]:
    req_id = (req.id or "").strip()
    if not req_id:
        raise ValueError("ID de variável é obrigatório.")
    existing = db.get(Variable, req_id)
    if existing:
        raise ValueError(f"Variável com ID '{req_id}' já existe.")
        
    sector_id = (req.setor_id or "").strip().upper() or "OUTROS"
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Criado via cadastro de variável", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
        
    tipo_str = (req.tipo or "INPUT").strip().upper()
    tipo = VariableType(tipo_str)
    etapa_str = (req.etapa or "").strip()
    pc_str = (req.ponto_controle or "").strip()
    db_cp = _resolve_control_point(sector_id, etapa_str, pc_str, db)
    
    v_ordem = getattr(req, 'ordem', 0) or 0
    if v_ordem <= 0:
        all_var_orders = db.exec(select(Variable.ordem).where(Variable.control_point_id == db_cp.id)).all()
        v_ordem = max(all_var_orders) + 10 if all_var_orders else 10

    in_hp = bool(getattr(req, 'in_harvest_plan', False))
    hp_op = getattr(req, 'harvest_plan_op', None)
    hp_weight = getattr(req, 'harvest_plan_weight_var_id', None)
    grouping = getattr(req, 'agrupamento', None)

    db_var = Variable(
        id=req_id,
        nome=(req.nome or "").strip() or req_id,
        descricao=(req.descricao or "").strip(),
        setor_id=sector_id,
        tipo=tipo,
        unidade=(req.unidade or "").strip(),
        status=VariableStatus((req.status or "ativa").strip().lower()),
        etapa=db_cp.stage_id.hex,
        ponto_controle=db_cp.id.hex,
        control_point_id=db_cp.id,
        ordem=v_ordem,
        casas_decimais=req.casas_decimais,
        tipo_exibicao=(req.tipo_exibicao or "NUMBER").strip(),
        percent_base=(req.percent_base or "DECIMAL").strip(),
        in_harvest_plan=in_hp,
        harvest_plan_op=hp_op if in_hp else None,
        harvest_plan_weight_var_id=hp_weight if (in_hp and hp_op == 'WEIGHTED_AVERAGE') else None
    )
    db.add(db_var)
    db.flush()
    
    if tipo in {VariableType.OUTPUT, VariableType.DERIVADA} and req.equation_value:
        _update_variable_equation(db_var.id, req.equation_value, db_var, db)
        
    _sync_variable_harvest_grouping(db_var.id, in_hp, grouping, db)
    db.commit()
    
    db_eq = db.exec(select(Equation).where(Equation.variable_id == db_var.id, Equation.status == "ativa")).first()
    eq_val = db_eq.expression_original if db_eq else ""
    return _format_variable_response(db_var, db_cp, etapa_str, pc_str, eq_val, grouping)


def update_variable(var_id: str, req, db: Session) -> Dict[str, Any]:
    db_var = db.get(Variable, var_id)
    if not db_var:
        raise ValueError(f"Variável '{var_id}' não encontrada.")
        
    sector_id = (req.setor_id or "").strip().upper() or "OUTROS"
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Criado via cadastro de variável", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
        
    tipo_str = (req.tipo or "INPUT").strip().upper()
    tipo = VariableType(tipo_str)
    etapa_str = (req.etapa or "").strip()
    pc_str = (req.ponto_controle or "").strip()
    db_cp = _resolve_control_point(sector_id, etapa_str, pc_str, db)
    
    v_ordem = getattr(req, 'ordem', 0) or 0
    if v_ordem <= 0:
        if db_var.control_point_id != db_cp.id:
            all_var_orders = db.exec(select(Variable.ordem).where(Variable.control_point_id == db_cp.id)).all()
            v_ordem = max(all_var_orders) + 10 if all_var_orders else 10
        else:
            v_ordem = db_var.ordem
            
    db_var.nome = (req.nome or "").strip() or db_var.id
    db_var.descricao = (req.descricao or "").strip()
    db_var.setor_id = sector_id
    db_var.tipo = tipo
    db_var.unidade = (req.unidade or "").strip()
    db_var.status = VariableStatus((req.status or "ativa").strip().lower())

    in_hp = bool(getattr(req, 'in_harvest_plan', False))
    hp_op = getattr(req, 'harvest_plan_op', None)
    hp_weight = getattr(req, 'harvest_plan_weight_var_id', None)
    grouping = getattr(req, 'agrupamento', None)

    if db_var.status == VariableStatus.INATIVA:
        in_hp = False
        hp_op = None
        hp_weight = None

    db_var.in_harvest_plan = in_hp
    db_var.harvest_plan_op = hp_op if in_hp else None
    db_var.harvest_plan_weight_var_id = hp_weight if (in_hp and hp_op == 'WEIGHTED_AVERAGE') else None

    db_var.control_point_id = db_cp.id
    db_var.ordem = v_ordem
    db_var.casas_decimais = req.casas_decimais
    db_var.tipo_exibicao = (req.tipo_exibicao or "NUMBER").strip()
    db_var.percent_base = (req.percent_base or "DECIMAL").strip()
    db.add(db_var)
    db.flush()
    
    if tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
        _update_variable_equation(db_var.id, req.equation_value or "", db_var, db)
    else:
        _update_variable_equation(db_var.id, "", db_var, db)

    _sync_variable_harvest_grouping(db_var.id, in_hp, grouping, db)
    db.commit()
    
    db_eq = db.exec(select(Equation).where(Equation.variable_id == db_var.id, Equation.status == "ativa")).first()
    eq_val = db_eq.expression_original if db_eq else ""
    return _format_variable_response(db_var, db_cp, etapa_str, pc_str, eq_val, grouping)
