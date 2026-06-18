#!/usr/bin/env python3
import argparse
import json
import re
import ssl
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import robotparser
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from scrapy_jobs.legal_registry import load_source_registry


PROJECT_ROOT = Path(__file__).resolve().parent
REPO_ROOT = PROJECT_ROOT.parent
SOURCE_LIST_PATH = REPO_ROOT / "docs" / "archive" / "initial-docs" / "WWSA-jobs-scraping- list.md"
LEDGER_PATH = PROJECT_ROOT / "config" / "source-ledger.json"
USER_AGENT = "WorkWiseSAJobAuditBot/1.0 (+https://workwise-sa.com; compliance preflight)"

KNOWN_SOURCES = {
    "careers24": {
        "displayName": "Careers24",
        "url": "https://www.careers24.com/jobs/",
        "spider": None,
    },
    "pnet": {
        "displayName": "PNet",
        "url": "https://www.pnet.co.za/jobs",
        "spider": None,
    },
    "indeed": {
        "displayName": "Indeed",
        "url": "https://za.indeed.com/jobs",
        "spider": None,
    },
    "jobmail": {
        "displayName": "Job Mail",
        "url": "https://www.jobmail.co.za/jobs",
        "spider": "jobmail_jobs",
    },
    "careerjunction": {
        "displayName": "CareerJunction",
        "url": "https://www.careerjunction.co.za/jobs/",
        "spider": None,
    },
    "gumtree": {
        "displayName": "Gumtree",
        "url": "https://www.gumtree.co.za/s-jobs/v1c8p1",
        "spider": "gumtree_jobs",
    },
    "linkedin": {
        "displayName": "LinkedIn",
        "url": "https://www.linkedin.com/jobs/search/?location=South%20Africa",
        "spider": None,
    },
    "jobjack": {
        "displayName": "JOBJACK",
        "url": "https://www.jobjack.co.za/jobs",
        "spider": None,
    },
    "ditto-jobs": {
        "displayName": "Ditto Jobs",
        "url": "https://www.dittojobs.com/jobs",
        "spider": None,
    },
    "company-websites-career-pages": {
        "displayName": "Company websites (career pages)",
        "url": None,
        "spider": None,
    },
    "bizcommunity": {
        "displayName": "Bizcommunity",
        "url": "https://www.bizcommunity.com/JobsOffered/196/1.html",
        "spider": "bizcommunity_jobs",
    },
}

SOURCE_ALIASES = {
    "job-mail": "jobmail",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    cleaned = re.sub(r"\s+\d+\s*$", "", value.strip())
    cleaned = cleaned.replace("\\&", "and").replace("&", "and")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", cleaned.lower()).strip("-")
    return cleaned or "unknown"


def load_source_names(limit: int) -> list[str]:
    text = SOURCE_LIST_PATH.read_text(encoding="utf-8")
    names: list[str] = []
    for line in text.splitlines():
        match = re.match(r"^\*\s+(.+?)\s*$", line)
        if not match:
            continue
        names.append(match.group(1).strip())
        if len(names) >= limit:
            break
    return names


def load_ledger() -> dict[str, Any]:
    if not LEDGER_PATH.exists():
        return {"schemaVersion": "source-ledger.v1", "runs": [], "sources": {}}
    try:
        return json.loads(LEDGER_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"schemaVersion": "source-ledger.v1", "runs": [], "sources": {}}


def save_ledger(ledger: dict[str, Any]) -> None:
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    LEDGER_PATH.write_text(json.dumps(ledger, indent=2, sort_keys=True), encoding="utf-8")


def fetch_url(url: str, timeout: int) -> tuple[int | None, str | None]:
    try:
        request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
        context = ssl.create_default_context()
        with urlopen(request, timeout=timeout, context=context) as response:
            return int(response.status), None
    except HTTPError as exc:
        return int(exc.code), str(exc)
    except URLError as exc:
        return None, str(exc.reason)
    except Exception as exc:
        return None, str(exc)


def robots_url_for(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def check_robots(url: str, timeout: int) -> dict[str, Any]:
    robots_url = robots_url_for(url)
    parser = robotparser.RobotFileParser()
    try:
        request = Request(robots_url, headers={"User-Agent": USER_AGENT, "Accept": "text/plain,*/*"})
        context = ssl.create_default_context()
        with urlopen(request, timeout=timeout, context=context) as response:
            content = response.read(1024 * 1024).decode("utf-8", errors="replace")
        parser.parse(content.splitlines())
        return {
            "robotsUrl": robots_url,
            "robotsAllowed": parser.can_fetch(USER_AGENT, url),
            "robotsError": None,
        }
    except Exception as exc:
        return {
            "robotsUrl": robots_url,
            "robotsAllowed": None,
            "robotsError": str(exc),
        }


def classify_block(status: int | None, error: str | None, robots_allowed: bool | None) -> tuple[bool, str]:
    if robots_allowed is False:
        return True, "robots_disallow"
    if status in {401, 403}:
        return True, "access_forbidden"
    if status == 404:
        return True, "not_found"
    if status == 429:
        return True, "rate_limited"
    if status and status >= 500:
        return True, "server_error"
    if status is None and error:
        lowered = error.lower()
        if "timed out" in lowered or "timeout" in lowered:
            return True, "timeout"
        if "ssl" in lowered or "certificate" in lowered:
            return True, "tls_error"
        return True, "network_error"
    return False, "open"


def source_metadata(name: str) -> dict[str, Any]:
    slug = SOURCE_ALIASES.get(slugify(name), slugify(name))
    known = KNOWN_SOURCES.get(slug, {})
    return {
        "slug": slug,
        "displayName": known.get("displayName") or re.sub(r"\s+\d+\s*$", "", name.strip()),
        "url": known.get("url"),
        "spider": known.get("spider"),
    }


def score_source(previous: dict[str, Any] | None, blocked: bool, block_reason: str, has_spider: bool) -> int:
    previous_score = int(previous.get("blockScore", 0)) if previous else 0
    previous_blocked = bool(previous.get("lastBlocked", False)) if previous else False

    score = previous_score
    if blocked:
        score += 2
        if not previous_blocked and previous:
            score += 3
    else:
        score = max(0, score - 1)

    if not has_spider:
        score += 1
    if block_reason == "robots_disallow":
        score += 4
    return min(score, 20)


def audit_source(name: str, registry: dict[str, Any], timeout: int) -> dict[str, Any]:
    meta = source_metadata(name)
    slug = meta["slug"]
    url = meta["url"]
    registry_entry = registry.get(slug)
    has_spider = bool(meta["spider"])

    result: dict[str, Any] = {
        **meta,
        "checkedAt": now_iso(),
        "listedName": name,
        "registered": bool(registry_entry),
        "registryStatus": registry_entry.get("approvalStatus") if registry_entry else "unregistered",
        "rolloutStage": registry_entry.get("rolloutStage") if registry_entry else "unregistered",
        "allowIngest": bool(registry_entry.get("allowIngest")) if registry_entry else False,
        "hasSpider": has_spider,
    }

    if not url:
        result.update(
            {
                "statusCode": None,
                "robotsAllowed": None,
                "blocked": True,
                "blockReason": "manual_source_group",
                "safeToAttempt": False,
                "reason": "This list item is a category of company career pages, not one scrape target.",
            }
        )
        return result

    robots = check_robots(url, timeout)
    status, error = fetch_url(url, timeout)
    blocked, block_reason = classify_block(status, error, robots["robotsAllowed"])
    safe_to_attempt = (not blocked) and has_spider and bool(registry_entry) and bool(registry_entry.get("enabled"))

    result.update(
        {
            **robots,
            "statusCode": status,
            "networkError": error,
            "blocked": blocked,
            "blockReason": block_reason if blocked else ("no_spider" if not has_spider else "none"),
            "safeToAttempt": safe_to_attempt,
            "reason": explain(result, blocked, block_reason, has_spider, registry_entry, status, error),
        }
    )
    return result


def explain(
    result: dict[str, Any],
    blocked: bool,
    block_reason: str,
    has_spider: bool,
    registry_entry: dict[str, Any] | None,
    status: int | None,
    error: str | None,
) -> str:
    if blocked:
        if block_reason == "robots_disallow":
            return "robots.txt does not allow this URL for the WorkWise audit user agent."
        if block_reason == "access_forbidden":
            return f"The site returned HTTP {status}, commonly bot protection, login gating, or access denial."
        if block_reason == "rate_limited":
            return "The site returned HTTP 429, indicating rate limiting."
        if block_reason == "not_found":
            return "The audited URL returned HTTP 404, so the source URL needs correction before crawling."
        if error:
            return f"Connectivity check failed: {error}"
        return f"Connectivity check blocked with reason: {block_reason}."
    if not has_spider:
        return "Robots/connectivity did not block the audit URL, but no WorkWise spider exists yet."
    if not registry_entry:
        return "A spider exists, but the source is not registered in the legal rollout registry."
    if not registry_entry.get("allowIngest"):
        return "Source is crawlable for pilot checks but not yet approved for production ingest."
    return "Robots/connectivity passed, spider exists, and source is approved for ingest."


def choose_next_batch(ledger: dict[str, Any], list_limit: int, batch_size: int) -> list[str]:
    names = load_source_names(list_limit)
    sources = ledger.get("sources", {})
    ranked = []
    unseen = []
    for name in names:
        slug = source_metadata(name)["slug"]
        state = sources.get(slug)
        if not state:
            unseen.append(name)
            continue
        if not state.get("lastBlocked") and state.get("hasSpider"):
            ranked.append((state.get("blockScore", 0), name))
    selected = [name for _score, name in sorted(ranked)[:batch_size]]
    for name in unseen:
        if len(selected) >= batch_size:
            break
        selected.append(name)
    for name in names:
        if len(selected) >= batch_size:
            break
        if name not in selected:
            selected.append(name)
    return selected[:batch_size]


def run_audit(limit: int, batch_size: int, timeout: int) -> dict[str, Any]:
    registry = load_source_registry()
    ledger = load_ledger()
    selected_names = choose_next_batch(ledger, max(limit, batch_size), batch_size)
    run_id = f"ledger_{int(time.time())}"
    audited = []

    for name in selected_names:
        result = audit_source(name, registry, timeout)
        previous = ledger.get("sources", {}).get(result["slug"])
        result["blockScore"] = score_source(
            previous,
            bool(result.get("blocked")),
            str(result.get("blockReason")),
            bool(result.get("hasSpider")),
        )
        result["lastBlocked"] = bool(result.get("blocked"))
        result["runId"] = run_id
        audited.append(result)
        ledger.setdefault("sources", {})[result["slug"]] = result

    summary = {
        "runId": run_id,
        "generatedAt": now_iso(),
        "batchSize": len(audited),
        "safeToAttempt": len([item for item in audited if item.get("safeToAttempt")]),
        "blocked": len([item for item in audited if item.get("blocked")]),
        "noSpider": len([item for item in audited if not item.get("hasSpider")]),
        "ingestApproved": len([item for item in audited if item.get("allowIngest")]),
    }
    ledger.setdefault("runs", []).append({**summary, "sources": [item["slug"] for item in audited]})
    ledger["latestRun"] = {**summary, "sources": audited}
    ledger["updatedAt"] = now_iso()
    save_ledger(ledger)
    return ledger


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit and score WorkWise scraping source safety.")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--timeout", type=int, default=12)
    args = parser.parse_args()
    ledger = run_audit(args.limit, args.batch_size, args.timeout)
    print(json.dumps(ledger["latestRun"], indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
