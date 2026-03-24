import re


EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
SA_PHONE_PATTERN = re.compile(
    r"(?:(?:\+27|0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{4})|(?:\+27|0)\s?\d{9}"
)
RECRUITER_PATTERN = re.compile(
    r"\b(?:contact|call|whatsapp|email|ask for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})"
)


class ComplianceError(Exception):
    pass


def _strip_personal_contact(text):
    if not text:
        return text

    sanitized = EMAIL_PATTERN.sub("[redacted-email]", text)
    sanitized = SA_PHONE_PATTERN.sub("[redacted-phone]", sanitized)
    sanitized = RECRUITER_PATTERN.sub(
        lambda match: match.group(0).replace(match.group(1), "[redacted-name]"),
        sanitized,
    )
    return sanitized


def apply_compliance(job):
    sanitized = dict(job)
    original_description = sanitized.get("description") or ""

    sanitized["description"] = _strip_personal_contact(original_description)
    sanitized["companyName"] = _strip_personal_contact(sanitized.get("companyName"))

    metadata = dict(sanitized.get("metadata") or {})
    metadata["isAnonymized"] = sanitized["description"] != original_description
    metadata["complianceVersion"] = "POPIA_v1"
    sanitized["metadata"] = metadata

    required_fields = [
        "title",
        "description",
        "companyName",
        "location",
        "sourceSite",
        "sourceUrl",
        "externalId",
    ]

    for field in required_fields:
        if not sanitized.get(field):
            raise ComplianceError(f"Missing required field: {field}")

    redaction_markers = sanitized["description"].count("[redacted-")
    if redaction_markers > 5:
        raise ComplianceError("Excessive personal data detected")

    return sanitized
