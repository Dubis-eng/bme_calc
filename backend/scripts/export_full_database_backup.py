import os
import sys
import json
import uuid
import datetime
from enum import Enum
from typing import Dict, Any, List
from sqlalchemy import inspect, text
from sqlmodel import Session

# Adjust path to find src packages
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import engine

def serialize_val(val: Any) -> Any:
    if isinstance(val, uuid.UUID):
        return str(val)
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.isoformat()
    if isinstance(val, Enum):
        return val.value
    return val

def backup_table(session: Session, table_name: str) -> List[Dict[str, Any]]:
    query = text(f'SELECT * FROM "{table_name}"')
    result = session.exec(query)
    rows = []
    for row in result.mappings():
        row_dict = {col: serialize_val(val) for col, val in row.items()}
        rows.append(row_dict)
    return rows

def create_full_backup() -> str:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    iso_timestamp = datetime.datetime.now().isoformat()
    
    backup_data: Dict[str, Any] = {
        "metadata": {
            "created_at": iso_timestamp,
            "total_tables": len(table_names),
        },
        "tables": {}
    }
    
    total_records = 0
    with Session(engine) as session:
        for table in sorted(table_names):
            rows = backup_table(session, table)
            backup_data["tables"][table] = rows
            count = len(rows)
            total_records += count
            print(f"  - Tabela '{table}': {count} registros exportados.")
            
    backup_data["metadata"]["total_records"] = total_records
    
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(scripts_dir)
    data_dir = os.path.join(backend_dir, "data")
    backups_dir = os.path.join(data_dir, "backups")
    
    os.makedirs(backups_dir, exist_ok=True)
    
    timestamp_file = os.path.join(backups_dir, f"full_database_backup_{timestamp}.json")
    latest_file = os.path.join(data_dir, "full_database_backup.json")
    
    for filepath in [timestamp_file, latest_file]:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
            
    print("\n[SUCCESS] Backup Total concluido com sucesso!")
    print(f"Total de tabelas: {len(table_names)}")
    print(f"Total de registros: {total_records}")
    print(f"Arquivo com timestamp: {timestamp_file}")
    print(f"Arquivo mais recente: {latest_file}")
    
    return latest_file

if __name__ == "__main__":
    create_full_backup()
