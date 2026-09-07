"""Test FastAPI upload-report endpoint — scripts/test_api_route.py"""
import sys
import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from backend.main import app
from scripts.test_pdf_pipeline import create_digital_pdf_bytes, create_scanned_pdf_bytes, create_mixed_pdf_bytes

client = TestClient(app)

def test_api_routes():
    print("Testing /api/upload-report endpoint with TestClient...")
    
    # 1. Digital PDF upload for musa_heart
    pdf_bytes = create_digital_pdf_bytes()
    response = client.post(
        "/api/upload-report?disease=musa_heart",
        files={"file": ("test_report.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["disease"] == "musa_heart"
    assert data["ocr_used"] is False
    assert data["page_count"] == 1
    assert "rows" in data
    print("  [PASS] /api/upload-report digital PDF test passed!")

    # 2. Scanned PDF upload for musa_hcv
    scanned_bytes = create_scanned_pdf_bytes()
    response = client.post(
        "/api/upload-report?disease=musa_hcv",
        files={"file": ("scanned_hcv.pdf", scanned_bytes, "application/pdf")}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["disease"] == "musa_hcv"
    assert data["ocr_used"] is True
    assert "extracted_text" in data
    print("  [PASS] /api/upload-report scanned PDF test passed!")

    # 3. Corrupt PDF upload
    response = client.post(
        "/api/upload-report?disease=musa_heart",
        files={"file": ("corrupt.pdf", b"%PDF-1.4\nCorrupted binary garbage without valid pdf structure", "application/pdf")}
    )
    assert response.status_code in (400, 422), f"Expected 400 or 422, got {response.status_code}: {response.text}"
    print("  [PASS] /api/upload-report corrupt PDF error handling passed!")

    # 4. Empty file upload
    response = client.post(
        "/api/upload-report?disease=musa_heart",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code in (400, 422), f"Expected 400 or 422, got {response.status_code}: {response.text}"
    print("  [PASS] /api/upload-report empty file error handling passed!")


if __name__ == "__main__":
    test_api_routes()
