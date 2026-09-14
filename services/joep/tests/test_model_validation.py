from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_scoring_endpoint_not_implemented():
    response = client.post("/score")
    assert response.status_code == 501
    assert response.json()["error_code"] == "SCORING_ENGINE_NOT_IMPLEMENTED"
