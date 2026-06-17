import uuid
import datetime
from typing import List, Dict, Any
from sqlmodel import select, Session
from database import (
    Scenario, Variable, Equation, Dependency, Result, Sector,
    ScenarioStatus, VariableType, VariableStatus, ResultStatus
)
from schemas import ScenarioDetail, SectorCreate, SectorUpdate, SectorDetail
import engine

def get_scenario_variables(scenario_id: uuid.UUID, db: Session) -> List[Dict[str, Any]]:
    results = db.exec(select(Result).where(Result.scenario_id == scenario_id)).all()
    results_map = {r.variable_id: r for r in results}
    db_vars = db.exec(select(Variable)).all()
    
    variables_list = []
    for var in db_vars:
        res = results_map.get(var.id)
        eq_val = ""
        if var.tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
            db_eq = db.exec(select(Equation).where(Equation.variable_id == var.id, Equation.status == "ativa")).first()
            if db_eq:
                eq_val = db_eq.expression_original
        else:
            if res and res.value is not None:
                eq_val = str(res.value)
                
        variables_list.append({
            "ID - REF": var.id,
            "SETOR": var.setor_id,
            "DEFINIÇÃO": var.nome,
            "DESCRIÇÃO": var.descricao,
            "TIPO": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "UNIDADE DE MEDIDA": var.unidade,
            "EQUAÇÕES E VALORES": eq_val
        })
    return variables_list

def create_new_scenario(req, db: Session) -> ScenarioDetail:
    # Query versions for the same period to assign the next version sequence
    stmt = select(Scenario.version).where(
        Scenario.year_harvest == req.year_harvest,
        Scenario.reference_month == req.reference_month
    ).order_by(Scenario.version.desc())
    versions = db.exec(stmt).all()
    next_version = (versions[0] + 1) if versions else 1

    scenario_id = uuid.uuid4()
    db_scenario = Scenario(
        id=scenario_id,
        nome=f"Cenário {req.year_harvest} - {req.reference_month} (v{next_version})",
        year_harvest=req.year_harvest,
        reference_month=req.reference_month,
        version=next_version,
        status=req.status or ScenarioStatus.EM_EDICAO
    )
    db.add(db_scenario)
    db.flush()

    # Calculate rich results to save values
    calc_res = engine.calculate_state(req.variables)
    results_map = calc_res["results"]

    for v in req.variables:
        var_id = v["ID - REF"]
        
        db_var = db.get(Variable, var_id)
        if not db_var:
            tipo_str = v.get("TIPO", "INPUT")
            tipo = VariableType.INPUT
            if tipo_str == "OUTPUT": tipo = VariableType.OUTPUT
            elif tipo_str == "DERIVADA": tipo = VariableType.DERIVADA
            elif tipo_str == "CENARIO": tipo = VariableType.CENARIO
            
            if var_id in {"DIA", "APROVEITAMENTO_OPERACIONAL", "DISPONIBILIDADE"}:
                tipo = VariableType.CENARIO
                
            nome = v.get("DEFINIÇÃO", "").strip() or v.get("DESCRIÇÃO", "").strip() or var_id
            
            sector_str = v.get("SETOR", "OUTROS").strip().upper()
            db_sector = db.get(Sector, sector_str)
            if not db_sector:
                db_sector = Sector(id=sector_str, nome=sector_str.title(), descricao="Criado automaticamente no cenário")
                db.add(db_sector)
                db.flush()

            db_var = Variable(
                id=var_id,
                nome=nome,
                descricao=v.get("DESCRIÇÃO", ""),
                setor_id=sector_str,
                tipo=tipo,
                unidade=v.get("UNIDADE DE MEDIDA", ""),
                status=VariableStatus.ATIVA
            )
            db.add(db_var)
            db.flush()

        eq_val = v.get("EQUAÇÕES E VALORES", "")
        if isinstance(eq_val, str) and eq_val.startswith("="):
            stmt_eq = select(Equation).where(Equation.variable_id == var_id, Equation.expression_original == eq_val)
            db_eq = db.exec(stmt_eq).first()
            if not db_eq:
                db_eq = Equation(
                    variable_id=var_id,
                    expression_original=eq_val,
                    expression_normalized=engine.normalize_formula(eq_val),
                    version=1,
                    status="ativa"
                )
                db.add(db_eq)
                db.flush()

                deps = engine.extract_dependencies(engine.normalize_formula(eq_val))
                for idx, dep_id in enumerate(sorted(deps)):
                    dep_var = db.get(Variable, dep_id)
                    if not dep_var:
                        dep_var = Variable(
                            id=dep_id,
                            nome=dep_id,
                            descricao="Auto-criado por dependência",
                            setor_id=db_var.setor_id,
                            tipo=VariableType.INPUT,
                            status=VariableStatus.PENDENTE
                        )
                        db.add(dep_var)
                        db.flush()
                    db_dep = Dependency(
                        equation_id=db_eq.id,
                        dependency_var_id=dep_id,
                        evaluation_order=idx
                    )
                    db.add(db_dep)

        var_calc = results_map.get(var_id, {"value": None, "status": "PENDING", "error_message": ""})
        val_float = var_calc.get("value")
        
        if not (isinstance(eq_val, str) and eq_val.startswith("=")):
            try: val_float = float(str(eq_val).replace(",", "."))
            except: pass

        db_res = Result(
            variable_id=var_id,
            scenario_id=scenario_id,
            value=val_float,
            status=var_calc.get("status", "OK"),
            error_message=var_calc.get("error_message", "")
        )
        db.add(db_res)

    db.commit()
    db.refresh(db_scenario)
    return ScenarioDetail(
        id=db_scenario.id,
        nome=db_scenario.nome,
        year_harvest=db_scenario.year_harvest,
        reference_month=db_scenario.reference_month,
        version=db_scenario.version,
        status=db_scenario.status,
        variables=get_scenario_variables(scenario_id, db),
        created_at=db_scenario.created_at,
        updated_at=db_scenario.updated_at
    )

def list_sectors(db: Session) -> List[Sector]:
    return db.exec(select(Sector).order_by(Sector.nome)).all()

def create_sector(req: SectorCreate, db: Session) -> Sector:
    sector_id = req.id.strip().upper()
    existing = db.get(Sector, sector_id)
    if existing:
        raise ValueError(f"Setor com ID '{sector_id}' já está cadastrado.")
    
    db_sector = Sector(
        id=sector_id,
        nome=req.nome.strip(),
        descricao=req.descricao.strip() if req.descricao else ""
    )
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

def update_sector(sector_id: str, req: SectorUpdate, db: Session) -> Sector:
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        raise ValueError("Setor não encontrado.")
    
    db_sector.nome = req.nome.strip()
    if req.descricao is not None:
        db_sector.descricao = req.descricao.strip()
    
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
