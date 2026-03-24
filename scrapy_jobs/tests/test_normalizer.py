from scrapy_jobs.middleware.compliance_middleware import ComplianceError, apply_compliance
from scrapy_jobs.utils.normalizer import (
    extract_external_id,
    normalize_job_item,
    normalize_job_title,
)


def test_normalize_job_title():
    assert normalize_job_title("Code 10 Driver Needed") == "Driver"


def test_extract_external_id_from_url():
    assert extract_external_id("https://example.com/jobs/1234567890") == "1234567890"


def test_apply_compliance_redacts_contacts():
    item = {
        "title": "Cashier",
        "description": "Call 082 123 4567 or email person@example.com",
        "companyName": "Example Co",
        "location": "Cape Town",
        "salaryText": None,
        "jobType": None,
        "workMode": None,
        "sourceSite": "gumtree",
        "sourceUrl": "https://example.com/jobs/1234567890",
        "externalId": "1234567890",
        "postedAt": None,
        "applyUrl": "https://example.com/jobs/1234567890",
    }

    result = apply_compliance(item)
    assert "[redacted-phone]" in result["description"]
    assert "[redacted-email]" in result["description"]
    assert result["metadata"]["complianceVersion"] == "POPIA_v1"


def test_normalize_job_item_populates_apply_url():
    item = {
        "title": "General Worker",
        "description": "Warehouse role",
        "companyName": "Example Co",
        "location": "jhb",
        "salaryText": "R5000 pm",
        "jobType": None,
        "workMode": None,
        "sourceSite": "gumtree",
        "sourceUrl": "https://example.com/jobs/1234567890",
        "externalId": None,
        "postedAt": None,
        "applyUrl": None,
    }

    normalized = normalize_job_item(item)
    assert normalized["location"] == "Johannesburg"
    assert normalized["applyUrl"] == normalized["sourceUrl"]


def test_apply_compliance_rejects_missing_required_fields():
    try:
        apply_compliance({"title": "Cashier"})
    except ComplianceError as exc:
        assert "Missing required field" in str(exc)
        return

    raise AssertionError("Expected ComplianceError")
