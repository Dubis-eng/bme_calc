import uuid
from typing import List, Any
from sqlmodel import select, Session
from src.db.database import Stage, ControlPoint, Variable

def reorder_stages(sector_id: str, stage_ids: List[Any], db: Session) -> bool:
    stages = db.exec(select(Stage).where(Stage.sector_id == sector_id)).all()
    stage_dict = {str(s.id): s for s in stages}
    for sid in stage_ids:
        s_key = str(sid)
        if s_key not in stage_dict:
            # Tentar achar pelo nome caso seja enviada uma string com o nome do estágio
            st_by_name = db.exec(select(Stage).where(Stage.sector_id == sector_id, Stage.nome == str(sid))).first()
            if st_by_name:
                stage_dict[s_key] = st_by_name
            else:
                continue
    for idx, sid in enumerate(stage_ids):
        s_key = str(sid)
        if s_key in stage_dict:
            stage_dict[s_key].ordem = (idx + 1) * 10
            db.add(stage_dict[s_key])
    db.commit()
    return True

def reorder_control_points(stage_id: Any, cp_ids: List[Any], db: Session) -> bool:
    cp_stage: Stage | None = None
    try:
        stage_uuid = uuid.UUID(str(stage_id))
        cp_stage = db.get(Stage, stage_uuid)
    except (ValueError, TypeError):
        pass

    if not cp_stage:
        cp_stage = db.exec(select(Stage).where(Stage.nome == str(stage_id))).first()

    for idx, cid in enumerate(cp_ids):
        cp: ControlPoint | None = None
        try:
            cuid = uuid.UUID(str(cid))
            cp = db.get(ControlPoint, cuid)
        except (ValueError, TypeError):
            pass

        if not cp:
            cp = db.exec(select(ControlPoint).where(ControlPoint.nome == str(cid))).first()

        if cp:
            if cp_stage:
                cp.stage_id = cp_stage.id
            cp.ordem = (idx + 1) * 10
            db.add(cp)

    db.commit()
    return True

def reorder_variables(cp_id: Any, var_ids: List[str], db: Session) -> bool:
    cp: ControlPoint | None = None
    try:
        cp_uuid = uuid.UUID(str(cp_id))
        cp = db.get(ControlPoint, cp_uuid)
    except (ValueError, TypeError):
        pass

    if not cp:
        cp = db.exec(select(ControlPoint).where(ControlPoint.nome == str(cp_id))).first()

    stage = db.get(Stage, cp.stage_id) if (cp and cp.stage_id) else None
    stage_name = stage.nome if stage else "GERAL"
    cp_name = cp.nome if cp else str(cp_id)

    for idx, vid in enumerate(var_ids):
        v = db.get(Variable, vid)
        if not v:
            continue
            
        if cp:
            v.control_point_id = cp.id
            v.ponto_controle = cp.nome
            v.etapa = stage_name
        else:
            v.ponto_controle = cp_name

        v.ordem = (idx + 1) * 10
        db.add(v)

    db.commit()
    return True
