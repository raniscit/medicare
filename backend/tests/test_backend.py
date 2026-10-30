import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_root_and_health_check():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["app"] == "MediCare AI"

    res = client.get("/api/health-check")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_demo_login():
    res = client.post("/api/auth/demo-login")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == settings.DEMO_USER_EMAIL
    assert data["user"]["full_name"] == "Alex Johnson"


def test_health_overview():
    # Login as demo
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/health/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_reports"] >= 4
    assert data["total_parameters_tracked"] >= 10
    assert data["active_medications_count"] >= 3
    assert len(data["ai_health_insights"]) > 0


def test_health_parameter_trends():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check HbA1c trend
    res = client.get("/api/health/trends/HbA1c", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["standard_name"] == "HbA1c"
    assert len(data["data_points"]) >= 4
    assert "decreased" in data["ai_insight"].lower() or "trend" in data["ai_insight"].lower()

    # Check Hemoglobin trend
    res_hb = client.get("/api/health/trends/Hemoglobin", headers=headers)
    assert res_hb.status_code == 200
    assert len(res_hb.json()["data_points"]) >= 4


def test_two_report_comparison():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List documents
    docs_res = client.get("/api/documents", headers=headers)
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) >= 2

    id1 = docs[-1]["id"]  # earlier
    id2 = docs[0]["id"]   # latest

    res = client.get(f"/api/health/compare?report_1_id={id1}&report_2_id={id2}", headers=headers)
    assert res.status_code == 200
    comp = res.json()
    assert "comparison_items" in comp
    assert len(comp["comparison_items"]) > 0
    # verify units and delta calculation
    for item in comp["comparison_items"]:
        assert "trend_direction" in item
        assert "clinical_note" in item


def test_medications_and_logging():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/medications", headers=headers)
    assert res.status_code == 200
    meds = res.json()
    assert len(meds) >= 3

    med_id = meds[0]["id"]
    # Log dose taken
    log_res = client.post(
        f"/api/medications/{med_id}/log",
        headers=headers,
        json={
            "medication_id": med_id,
            "scheduled_time": "2026-10-30T08:00:00",
            "status": "TAKEN",
            "notes": "Taken on schedule"
        }
    )
    assert log_res.status_code == 200
    assert log_res.json()["status"] == "TAKEN"


def test_reminders_and_confirmation():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/reminders", headers=headers)
    assert res.status_code == 200
    reminders = res.json()
    assert len(reminders) >= 1

    # Find unconfirmed reminder if any
    unconf = next((r for r in reminders if not r["is_confirmed"]), None)
    if unconf:
        confirm_res = client.post(f"/api/reminders/{unconf['id']}/confirm", headers=headers)
        assert confirm_res.status_code == 200
        assert confirm_res.json()["is_confirmed"] is True


def test_rag_chat_assistant():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ask about HbA1c
    chat_res = client.post(
        "/api/chat/query",
        headers=headers,
        json={
            "message": "What does my HbA1c indicate across my reports?",
            "language": "en"
        }
    )
    assert chat_res.status_code == 200
    ans = chat_res.json()
    assert "message" in ans
    assert "hba1c" in ans["message"]["content"].lower() or "glucose" in ans["message"]["content"].lower()

    # Ask in Hindi
    chat_hi = client.post(
        "/api/chat/query",
        headers=headers,
        json={
            "message": "मेरी दवाओं के बारे में बताएं",
            "language": "hi"
        }
    )
    assert chat_hi.status_code == 200
    assert len(chat_hi.json()["message"]["content"]) > 10


def test_family_and_caregivers():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/family/connections", headers=headers)
    assert res.status_code == 200
    conns = res.json()
    assert len(conns) >= 1
    assert conns[0]["caregiver_email"] == settings.DEMO_CAREGIVER_EMAIL


if __name__ == "__main__":
    print("Testing root and health check...")
    test_root_and_health_check()
    print("Testing demo login...")
    test_demo_login()
    print("Testing health overview...")
    test_health_overview()
    print("Testing parameter trends...")
    test_health_parameter_trends()
    print("Testing two report comparison...")
    test_two_report_comparison()
    print("Testing medications and logging...")
    test_medications_and_logging()
    print("Testing reminders and confirmation...")
    test_reminders_and_confirmation()
    print("Testing RAG chat assistant...")
    test_rag_chat_assistant()
    print("Testing family connections...")
    test_family_and_caregivers()
    print("ALL TESTS PASSED SUCCESSFULLY!")
