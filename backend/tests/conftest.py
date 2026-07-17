import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session

# Set default test database URL before importing database module
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from src import main
from src.db.database import create_db_and_tables, engine, get_session

@pytest.fixture(name="session")
def session_fixture():
    """Provides an isolated SQLModel session for database operations."""
    create_db_and_tables()
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass

@pytest.fixture(name="client")
def client_fixture(session):
    """Provides a TestClient with overridden get_session dependency pointing to the test database."""
    def get_session_override():
        yield session
        
    main.app.dependency_overrides[get_session] = get_session_override
    with TestClient(main.app) as client:
        yield client
    main.app.dependency_overrides.clear()
