import datetime
from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from database import (
    Variable, Equation, Dependency, Sector,
    VariableType, VariableStatus
)
from schemas import SectorCreate, SectorUpdate
import engine

def list_sectors(db: Session) -> List[Sector]:
    return db.exec(select(Sector).order_by(Sector.ordem)).all()

def create_sector(req: SectorCreate, db: Session) -> Sector:
    sector_id = req.id.strip().upper()
    existing = db.get(Sector, sector_id)
    if existing:
        raise ValueError(f"Setor com ID '{sector_id}' já está cadastrado.")
    
    existing_ordem = db.exec(select(Sector).where(Sector.ordem == req.ordem)).first()
    if existing_ordem:
        raise ValueError(f"A ordem {req.ordem} já está em uso pelo setor '{existing_ordem.nome}'.")
    
    db_sector = Sector(
        id=sector_id,
        nome=req.nome.strip(),
        descricao=req.descricao.strip() if req.descricao else "",
        ordem=req.ordem
    )
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

def update_sector(sector_id: str, req: SectorUpdate, db: Session) -> Sector:
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        raise ValueError("Setor não encontrado.")
    
    existing_ordem = db.exec(select(Sector).where(Sector.ordem == req.ordem, Sector.id != sector_id)).first()
    if existing_ordem:
        raise ValueError(f"A ordem {req.ordem} já está em uso pelo setor '{existing_ordem.nome}'.")
    
    db_sector.nome = req.nome.strip()
    if req.descricao is not None:
        db_sector.descricao = req.descricao.strip()
    db_sector.ordem = req.ordem
    
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

def delete_sector(sector_id: str, db: Session) -> bool:
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        raise ValueError("Setor não encontrado.")
    
    stmt = select(Variable).where(Variable.setor_id == sector_id)
    vars_associated = db.exec(stmt).all()
    if vars_associated:
        raise ValueError(f"Não é possível excluir o setor '{db_sector.nome}' porque existem {len(vars_associated)} variáveis associadas a ele.")
    
    db.delete(db_sector)
    db.commit()
    return True

def _update_variable_equation(var_id: str, new_eq_val: str, db_var: Variable, db: Session):
    stmt = select(Equation).where(Equation.variable_id == var_id, Equation.status == "ativa")
    active_eqs = db.exec(stmt).all()
    
    if not (isinstance(new_eq_val, str) and new_eq_val.startswith("=")):
        for eq in active_eqs:
            eq.status = "desativada"
            eq.updated_at = datetime.datetime.utcnow()
            db.add(eq)
        db.flush()
        return

    for eq in active_eqs:
        if eq.expression_original == new_eq_val:
            return

    for eq in active_eqs:
        eq.status = "desativada"
        eq.updated_at = datetime.datetime.utcnow()
        db.add(eq)
    db.flush()

    db_eq = Equation(
        variable_id=var_id,
        expression_original=new_eq_val,
        expression_normalized=engine.normalize_formula(new_eq_val),
        version=len(active_eqs) + 1,
        status="ativa"
    )
    db.add(db_eq)
    db.flush()
    
    deps = engine.extract_dependencies(engine.normalize_formula(new_eq_val))
    for idx, dep_id in enumerate(sorted(deps)):
        dep_var = db.get(Variable, dep_id)
        if not dep_var:
            dep_var = Variable(
                id=dep_id, nome=dep_id, descricao="Auto-criado por dependência",
                setor_id=db_var.setor_id, tipo=VariableType.INPUT, status=VariableStatus.PENDENTE
            )
            db.add(dep_var)
            db.flush()
        db_dep = Dependency(equation_id=db_eq.id, dependency_var_id=dep_id, evaluation_order=idx)
        db.add(db_dep)

def list_variables(db: Session) -> List[Dict[str, Any]]:
    db_vars = db.exec(select(Variable)).all()
    eqs = db.exec(select(Equation).where(Equation.status == "ativa")).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in eqs}
    
    vars_list = []
    for var in db_vars:
        eq_val = eq_map.get(var.id, "")
        vars_list.append({
            "id": var.id,
            "nome": var.nome,
            "descricao": var.descricao,
            "setor_id": var.setor_id,
            "tipo": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "unidade": var.unidade,
            "status": var.status.value if hasattr(var.status, 'value') else str(var.status),
            "etapa": var.etapa,
            "ponto_controle": var.ponto_controle,
            "equation_value": eq_val
        })
    return vars_list

def create_variable(req, db: Session) -> Dict[str, Any]:
    existing = db.get(Variable, req.id)
    if existing:
        raise ValueError(f"Variável com ID '{req.id}' já existe.")
        
    sector_id = req.setor_id.strip().upper()
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Criado via cadastro de variável", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
        
    tipo = VariableType(req.tipo.strip().upper())
    
    db_var = Variable(
        id=req.id.strip(),
        nome=req.nome.strip(),
        descricao=req.descricao.strip() if req.descricao else "",
        setor_id=sector_id,
        tipo=tipo,
        unidade=req.unidade.strip() if req.unidade else "",
        status=VariableStatus(req.status.strip() if req.status else "ativa"),
        etapa=req.etapa.strip() if req.etapa else "",
        ponto_controle=req.ponto_controle.strip() if req.ponto_controle else ""
    )
    db.add(db_var)
    db.flush()
    
    if tipo in {VariableType.OUTPUT, VariableType.DERIVADA} and req.equation_value:
        _update_variable_equation(db_var.id, req.equation_value, db_var, db)
        
    db.commit()
    
    db_eq = db.exec(select(Equation).where(Equation.variable_id == db_var.id, Equation.status == "ativa")).first()
    eq_val = db_eq.expression_original if db_eq else ""
    
    return {
        "id": db_var.id,
        "nome": db_var.nome,
        "descricao": db_var.descricao,
        "setor_id": db_var.setor_id,
        "tipo": db_var.tipo.value,
        "unidade": db_var.unidade,
        "status": db_var.status.value,
        "etapa": db_var.etapa,
        "ponto_controle": db_var.ponto_controle,
        "equation_value": eq_val
    }

def update_variable(var_id: str, req, db: Session) -> Dict[str, Any]:
    db_var = db.get(Variable, var_id)
    if not db_var:
        raise ValueError(f"Variável '{var_id}' não encontrada.")
        
    sector_id = req.setor_id.strip().upper()
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Criado via cadastro de variável", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
        
    tipo = VariableType(req.tipo.strip().upper())
    
    db_var.nome = req.nome.strip()
    db_var.descricao = req.descricao.strip() if req.descricao else ""
    db_var.setor_id = sector_id
    db_var.tipo = tipo
    db_var.unidade = req.unidade.strip() if req.unidade else ""
    db_var.status = VariableStatus(req.status.strip() if req.status else "ativa")
    db_var.etapa = req.etapa.strip() if req.etapa else ""
    db_var.ponto_controle = req.ponto_controle.strip() if req.ponto_controle else ""
    db.add(db_var)
    db.flush()
    
    if tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
        _update_variable_equation(db_var.id, req.equation_value, db_var, db)
    else:
        _update_variable_equation(db_var.id, "", db_var, db)
        
    db.commit()
    
    db_eq = db.exec(select(Equation).where(Equation.variable_id == db_var.id, Equation.status == "ativa")).first()
    eq_val = db_eq.expression_original if db_eq else ""
    
    return {
        "id": db_var.id,
        "nome": db_var.nome,
        "descricao": db_var.descricao,
        "setor_id": db_var.setor_id,
        "tipo": db_var.tipo.value,
        "unidade": db_var.unidade,
        "status": db_var.status.value,
        "etapa": db_var.etapa,
        "ponto_controle": db_var.ponto_controle,
        "equation_value": eq_val
    }

