import uuid
from typing import List, Any
from sqlmodel import select, Session
from database import Stage, ControlPoint, Variable

def reorder_stages(sector_id: str, stage_ids: List[Any], db: Session) -> bool:
    stages = db.exec(select(Stage).where(Stage.sector_id == sector_id)).all()
    stage_dict = {s.id: s for s in stages}
    for sid in stage_ids:
        uid = uuid.UUID(sid) if isinstance(sid, str) else sid
        if uid not in stage_dict:
            raise ValueError(f"Estágio {sid} não pertence ao setor {sector_id}.")
    for idx, sid in enumerate(stage_ids):
        uid = uuid.UUID(sid) if isinstance(sid, str) else sid
        stage_dict[uid].ordem = (idx + 1) * 10
        db.add(stage_dict[uid])
    db.commit()
    return True

def reorder_control_points(stage_id: Any, cp_ids: List[Any], db: Session) -> bool:
    stage_uuid = uuid.UUID(stage_id) if isinstance(stage_id, str) else stage_id
    stage = db.get(Stage, stage_uuid)
    if not stage:
        raise ValueError(f"Estágio {stage_id} não encontrado.")
    
    for idx, cid in enumerate(cp_ids):
        cuid = uuid.UUID(cid) if isinstance(cid, str) else cid
        cp = db.get(ControlPoint, cuid)
        if not cp:
            raise ValueError(f"Ponto de Controle {cid} não encontrado.")
        
        # Move control point to this stage (supporting cross-stage drag-and-drop)
        cp.stage_id = stage_uuid
        cp.ordem = (idx + 1) * 10
        db.add(cp)
    db.commit()
    return True

def reorder_variables(cp_id: Any, var_ids: List[str], db: Session) -> bool:
    cp_uuid = uuid.UUID(cp_id) if isinstance(cp_id, str) else cp_id
    cp = db.get(ControlPoint, cp_uuid)
    if not cp:
        raise ValueError(f"Ponto de Controle {cp_id} não encontrado.")
    
    stage = db.get(Stage, cp.stage_id) if cp.stage_id else None
    stage_name = stage.nome if stage else "GERAL"
    
    for idx, vid in enumerate(var_ids):
        v = db.get(Variable, vid)
        if not v:
            raise ValueError(f"Variável {vid} não encontrada.")
            
        # Move variable to this control point and sync stage/cp text names (supporting cross-cp drag-and-drop)
        v.control_point_id = cp_uuid
        v.ponto_controle = cp.nome
        v.etapa = stage_name
        v.ordem = (idx + 1) * 10
        db.add(v)
    db.commit()
    return True
