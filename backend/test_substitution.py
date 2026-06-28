import pytest
from sqlmodel import Session, select
from sqlalchemy import text
from database import engine, Variable, Equation, Dependency, Result, Sector, VariableType, VariableStatus, create_db_and_tables
from engine import substitute_variable_in_formula
from services_substitution import get_substitution_preview, confirm_variable_substitution

def test_ast_substitution_precedence():
    # Test cases for operators precedence
    # 1. Addition replaced in multiplication (needs parentheses)
    res1 = substitute_variable_in_formula("=J168 * 2", "J168", "J34 + 10")
    assert res1 == "=(J34 + 10) * 2"

    # 2. Variable replaced with a single variable (no parentheses needed)
    res2 = substitute_variable_in_formula("=J168 * 2", "J168", "J34")
    assert res2 == "=J34 * 2"

    # 3. Addition replaced in addition (regex adds parentheses to protect the expression)
    res3 = substitute_variable_in_formula("=J168 + 5", "J168", "J34 + 10")
    assert res3 == "=(J34 + 10) + 5"

    # 4. Multi-level expressions
    res4 = substitute_variable_in_formula("=LN(J168)", "J168", "J34 + 10")
    assert res4 == "=LN((J34 + 10))"

def test_substitution_preview_and_confirm():
    # Setup fresh DB session (in-memory sqlite or the local test engine if configured)
    create_db_and_tables()
    with Session(engine) as session:
        # Pre-test cleanup to avoid residues
        try:
            session.execute(text("DELETE FROM dependencies WHERE dependency_var_id IN ('T_J34', 'T_J168', 'T_J167', 'T_J166')"))
            session.execute(text("DELETE FROM results WHERE variable_id IN ('T_J168', 'T_J167', 'T_J166')"))
            session.execute(text("DELETE FROM equations WHERE variable_id IN ('T_J168', 'T_J167', 'T_J166')"))
            session.execute(text("DELETE FROM variables WHERE id IN ('T_J34', 'T_J168', 'T_J167', 'T_J166')"))
            session.execute(text("DELETE FROM sectors WHERE id = 'TEST_SEC'"))
            session.commit()
        except Exception:
            session.rollback()

        # Seed test sectors & variables
        sec = Sector(id="TEST_SEC", nome="Test Sector", ordem=999)
        session.add(sec)
        session.flush()

        v_j34 = Variable(id="T_J34", nome="J34", setor_id="TEST_SEC", tipo=VariableType.INPUT, status=VariableStatus.ATIVA)
        v_j168 = Variable(id="T_J168", nome="J168", setor_id="TEST_SEC", tipo=VariableType.DERIVADA, status=VariableStatus.ATIVA)
        v_j167 = Variable(id="T_J167", nome="J167", setor_id="TEST_SEC", tipo=VariableType.OUTPUT, status=VariableStatus.ATIVA)
        v_j166 = Variable(id="T_J166", nome="J166", setor_id="TEST_SEC", tipo=VariableType.DERIVADA, status=VariableStatus.ATIVA)

        session.add_all([v_j34, v_j168, v_j167, v_j166])
        session.flush()

        # Equations
        eq_j168 = Equation(variable_id="T_J168", expression_original="=T_J34 + 10", expression_normalized="T_J34 + 10", status="ativa", version=1)
        eq_j167 = Equation(variable_id="T_J167", expression_original="=T_J168 * 2", expression_normalized="T_J168 * 2", status="ativa", version=1)
        eq_j166 = Equation(variable_id="T_J166", expression_original="=T_J167 + 5", expression_normalized="T_J167 + 5", status="ativa", version=1)

        session.add_all([eq_j168, eq_j167, eq_j166])
        session.flush()

        # Dependencies
        dep1 = Dependency(equation_id=eq_j168.id, dependency_var_id="T_J34", evaluation_order=0)
        dep2 = Dependency(equation_id=eq_j167.id, dependency_var_id="T_J168", evaluation_order=0)
        dep3 = Dependency(equation_id=eq_j166.id, dependency_var_id="T_J167", evaluation_order=0)
        session.add_all([dep1, dep2, dep3])
        session.flush()

        # Test non-recursive preview
        affected_nr, unused_nr = get_substitution_preview("T_J168", False, session)
        assert len(affected_nr) == 1
        assert affected_nr[0]["variable_id"] == "T_J167"
        assert affected_nr[0]["expression_before"] == "=T_J168 * 2"
        assert affected_nr[0]["expression_after"] == "=(T_J34 + 10) * 2"
        assert unused_nr is True

        # Test recursive preview
        affected_r, unused_r = get_substitution_preview("T_J168", True, session)
        assert len(affected_r) == 2
        # T_J167 before/after
        assert affected_r[0]["variable_id"] == "T_J167"
        assert affected_r[0]["expression_after"] == "=(T_J34 + 10) * 2"
        # T_J166 before/after
        assert affected_r[1]["variable_id"] == "T_J166"
        assert affected_r[1]["expression_after"] == "=((T_J34 + 10) * 2) + 5"
        assert unused_r is True

        # Confirm substitution with recursive=True and action_unused="archive"
        count = confirm_variable_substitution("T_J168", True, "archive", session)
        assert count == 2

        # Verify database equations updated
        eq_j167_updated = session.exec(select(Equation).where(Equation.variable_id == "T_J167", Equation.status == "ativa")).first()
        assert eq_j167_updated.expression_original == "=(T_J34 + 10) * 2"

        eq_j166_updated = session.exec(select(Equation).where(Equation.variable_id == "T_J166", Equation.status == "ativa")).first()
        assert eq_j166_updated.expression_original == "=((T_J34 + 10) * 2) + 5"

        # Verify target is archived
        db_j168 = session.get(Variable, "T_J168")
        assert db_j168.status == VariableStatus.DESCONTINUADA

        # Clear test entities
        session.exec(select(Dependency).where(Dependency.dependency_var_id == "T_J34")).all()
        # Clean up database test entities physically to avoid residue
        session.execute(text("DELETE FROM dependencies WHERE dependency_var_id IN ('T_J34', 'T_J168', 'T_J167', 'T_J166')"))
        session.execute(text("DELETE FROM results WHERE variable_id IN ('T_J168', 'T_J167', 'T_J166')"))
        session.execute(text("DELETE FROM equations WHERE variable_id IN ('T_J168', 'T_J167', 'T_J166')"))
        session.execute(text("DELETE FROM variables WHERE id IN ('T_J34', 'T_J168', 'T_J167', 'T_J166')"))
        session.execute(text("DELETE FROM sectors WHERE id = 'TEST_SEC'"))
        session.commit()

def test_substitution_confirm_delete():
    create_db_and_tables()
    with Session(engine) as session:
        # Pre-test cleanup to avoid residues
        try:
            session.execute(text("DELETE FROM dependencies WHERE dependency_var_id IN ('TD_J34', 'TD_J168', 'TD_J167')"))
            session.execute(text("DELETE FROM results WHERE variable_id IN ('TD_J168', 'TD_J167')"))
            session.execute(text("DELETE FROM equations WHERE variable_id IN ('TD_J168', 'TD_J167')"))
            session.execute(text("DELETE FROM variables WHERE id IN ('TD_J34', 'TD_J168', 'TD_J167')"))
            session.execute(text("DELETE FROM sectors WHERE id = 'TEST_SEC_DEL'"))
            session.commit()
        except Exception:
            session.rollback()

        sec = Sector(id="TEST_SEC_DEL", nome="Test Sector Del", ordem=998)
        session.add(sec)
        session.flush()

        v_j34 = Variable(id="TD_J34", nome="J34", setor_id="TEST_SEC_DEL", tipo=VariableType.INPUT, status=VariableStatus.ATIVA)
        v_j168 = Variable(id="TD_J168", nome="J168", setor_id="TEST_SEC_DEL", tipo=VariableType.DERIVADA, status=VariableStatus.ATIVA)
        v_j167 = Variable(id="TD_J167", nome="J167", setor_id="TEST_SEC_DEL", tipo=VariableType.OUTPUT, status=VariableStatus.ATIVA)

        session.add_all([v_j34, v_j168, v_j167])
        session.flush()

        eq_j168 = Equation(variable_id="TD_J168", expression_original="=TD_J34 + 10", expression_normalized="TD_J34 + 10", status="ativa", version=1)
        eq_j167 = Equation(variable_id="TD_J167", expression_original="=TD_J168 * 2", expression_normalized="TD_J168 * 2", status="ativa", version=1)

        session.add_all([eq_j168, eq_j167])
        session.flush()

        dep1 = Dependency(equation_id=eq_j168.id, dependency_var_id="TD_J34", evaluation_order=0)
        dep2 = Dependency(equation_id=eq_j167.id, dependency_var_id="TD_J168", evaluation_order=0)
        session.add_all([dep1, dep2])
        session.flush()

        # Confirm substitution with recursive=False and action_unused="delete"
        count = confirm_variable_substitution("TD_J168", False, "delete", session)
        assert count == 1

        # Verify target is physically deleted
        db_j168 = session.get(Variable, "TD_J168")
        assert db_j168 is None

        # Clear test entities
        session.execute(text("DELETE FROM dependencies WHERE dependency_var_id IN ('TD_J34', 'TD_J168', 'TD_J167')"))
        session.execute(text("DELETE FROM results WHERE variable_id IN ('TD_J168', 'TD_J167')"))
        session.execute(text("DELETE FROM equations WHERE variable_id IN ('TD_J168', 'TD_J167')"))
        session.execute(text("DELETE FROM variables WHERE id IN ('TD_J34', 'TD_J168', 'TD_J167')"))
        session.execute(text("DELETE FROM sectors WHERE id = 'TEST_SEC_DEL'"))
        session.commit()

def test_substitution_custom_expression():
    create_db_and_tables()
    with Session(engine) as session:
        # Pre-test cleanup
        try:
            session.execute(text("DELETE FROM dependencies WHERE dependency_var_id IN ('TC_J34', 'TC_J168', 'TC_J167')"))
            session.execute(text("DELETE FROM results WHERE variable_id IN ('TC_J168', 'TC_J167')"))
            session.execute(text("DELETE FROM equations WHERE variable_id IN ('TC_J168', 'TC_J167')"))
            session.execute(text("DELETE FROM variables WHERE id IN ('TC_J34', 'TC_J168', 'TC_J167')"))
            session.execute(text("DELETE FROM sectors WHERE id = 'TEST_SEC_CUST'"))
            session.commit()
        except Exception:
            session.rollback()

        sec = Sector(id="TEST_SEC_CUST", nome="Test Sector Cust", ordem=997)
        session.add(sec)
        session.flush()

        v_j34 = Variable(id="TC_J34", nome="J34", setor_id="TEST_SEC_CUST", tipo=VariableType.INPUT, status=VariableStatus.ATIVA)
        v_j168 = Variable(id="TC_J168", nome="J168", setor_id="TEST_SEC_CUST", tipo=VariableType.OUTPUT, status=VariableStatus.DESCONTINUADA)
        v_j167 = Variable(id="TC_J167", nome="J167", setor_id="TEST_SEC_CUST", tipo=VariableType.OUTPUT, status=VariableStatus.ATIVA)

        session.add_all([v_j34, v_j168, v_j167])
        session.flush()

        eq_j167 = Equation(variable_id="TC_J167", expression_original="=TC_J168 * 2", expression_normalized="TC_J168 * 2", status="ativa", version=1)
        session.add(eq_j167)
        session.flush()

        dep1 = Dependency(equation_id=eq_j167.id, dependency_var_id="TC_J168", evaluation_order=0)
        session.add(dep1)
        session.flush()

        # Preview with custom replacement expression
        affected, becomes_unused = get_substitution_preview("TC_J168", False, session, "=TC_J34 + 10")
        assert len(affected) == 1
        assert affected[0]["variable_id"] == "TC_J167"
        assert affected[0]["expression_after"] == "=(TC_J34 + 10) * 2"

        # Confirm with custom expression
        count = confirm_variable_substitution("TC_J168", False, "delete", session, "=TC_J34 + 10")
        assert count == 1

        # Verify database equations updated
        eq_j167_updated = session.exec(select(Equation).where(Equation.variable_id == "TC_J167", Equation.status == "ativa")).first()
        assert eq_j167_updated.expression_original == "=(TC_J34 + 10) * 2"

        # Verify target deleted
        db_j168 = session.get(Variable, "TC_J168")
        assert db_j168 is None

        # Clean up
        session.execute(text("DELETE FROM dependencies WHERE dependency_var_id IN ('TC_J34', 'TC_J168', 'TC_J167')"))
        session.execute(text("DELETE FROM results WHERE variable_id IN ('TC_J168', 'TC_J167')"))
        session.execute(text("DELETE FROM equations WHERE variable_id IN ('TC_J168', 'TC_J167')"))
        session.execute(text("DELETE FROM variables WHERE id IN ('TC_J34', 'TC_J168', 'TC_J167')"))
        session.execute(text("DELETE FROM sectors WHERE id = 'TEST_SEC_CUST'"))
        session.commit()
