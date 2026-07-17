from typing import List
from sqlmodel import select, Session
from src.db.database import Sector, Variable
from src.schemas.schemas import SectorCreate, SectorUpdate

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
