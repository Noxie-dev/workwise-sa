import re
from copy import deepcopy
from datetime import datetime, timezone


LOCATION_ALIASES = {
    "jhb": "Johannesburg",
    "jozi": "Johannesburg",
    "cpt": "Cape Town",
    "ct": "Cape Town",
    "dbn": "Durban",
    "pta": "Pretoria",
    "pe": "Gqeberha",
}


def normalize_job_title(title):
    if not title:
        return None

    cleaned = re.sub(r"\s+", " ", title).strip()
    replacements = {
        "code 10 driver": "Driver",
        "code 14 driver": "Driver",
        "general worker": "General Worker",
    }
    lowered = cleaned.lower()
    for source, target in replacements.items():
        if source in lowered:
            return target
    return cleaned[:200]


def normalize_salary_text(text):
    if not text:
        return None
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned[:200] or None


def normalize_location(location):
    if not location:
        return "South Africa"

    cleaned = re.sub(r"\s+", " ", location).strip()
    lowered = cleaned.lower()
    for alias, canonical in LOCATION_ALIASES.items():
        if alias in lowered:
            return canonical
    return cleaned[:200]


def extract_external_id(source_url, existing_external_id=None):
    if existing_external_id:
        return str(existing_external_id)

    if not source_url:
        return None

    match = re.search(r"/(\d{8,})/?$", source_url)
    if match:
        return match.group(1)

    return source_url.rstrip("/").split("/")[-1] or None


def normalize_job_item(item):
    normalized = deepcopy(dict(item))
    normalized["title"] = normalize_job_title(normalized.get("title"))
    normalized["location"] = normalize_location(normalized.get("location"))
    normalized["salaryText"] = normalize_salary_text(normalized.get("salaryText"))
    normalized["externalId"] = extract_external_id(
        normalized.get("sourceUrl"),
        normalized.get("externalId"),
    )
    posted_at = normalized.get("postedAt")
    if posted_at:
        try:
            parsed = datetime.fromisoformat(str(posted_at).replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            normalized["postedAt"] = parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        except ValueError:
            normalized["postedAt"] = None
    normalized["jobType"] = normalized.get("jobType") or None
    normalized["workMode"] = normalized.get("workMode") or None
    normalized["applyUrl"] = normalized.get("applyUrl") or normalized.get("sourceUrl")
    return normalized
