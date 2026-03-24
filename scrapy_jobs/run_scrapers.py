#!/usr/bin/env python3
import argparse
import json
import logging
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import requests
from scrapy_jobs.legal_registry import (
    SourceRegistryError,
    enforce_source_rollout,
    get_source_readiness_summary,
    validate_source,
)


PROJECT_ROOT = Path(__file__).resolve().parent
OUTPUT_ROOT = PROJECT_ROOT / "output"
LOGS_ROOT = PROJECT_ROOT / "logs"
SCRAPY_PROJECT_DIR = PROJECT_ROOT
DEFAULT_SOURCES = {
    "gumtree": "gumtree_jobs",
    "jobmail": "jobmail_jobs",
    "bizcommunity": "bizcommunity_jobs",
}


def configure_logging():
    LOGS_ROOT.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(LOGS_ROOT / "job_scraping.log"),
            logging.StreamHandler(),
        ],
    )


logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="WorkWise SA scraping orchestrator")
    parser.add_argument("--source", default="all", help="gumtree or all")
    parser.add_argument("--ingest", default="false", help="true to POST normalized artifacts")
    parser.add_argument("--concurrent", type=int, default=1, help="number of spiders to run in parallel")
    parser.add_argument("--max-items", type=int, default=0, help="close spider after N items when greater than 0")
    parser.add_argument(
        "--allow-unverified",
        action="store_true",
        help="bypass legal registry approval checks for local experimentation",
    )
    return parser.parse_args()


def selected_spiders(source):
    if source == "all":
        return list(DEFAULT_SOURCES.values())
    if source in DEFAULT_SOURCES:
        return [DEFAULT_SOURCES[source]]
    if source in DEFAULT_SOURCES.values():
        return [source]
    raise ValueError(f"Unsupported source: {source}")


def source_name_for_spider(spider_name):
    for source_name, configured_spider in DEFAULT_SOURCES.items():
        if configured_spider == spider_name:
            return source_name
    return spider_name


def run_spider(spider_name, max_items=0):
    cmd = ["scrapy", "crawl", spider_name, "-L", "INFO"]
    if max_items > 0:
        cmd.extend(["-s", f"CLOSESPIDER_ITEMCOUNT={max_items}"])
    result = subprocess.run(
        cmd,
        cwd=SCRAPY_PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=3600,
    )

    normalized_path = OUTPUT_ROOT / "normalized" / f"{spider_name}.json"
    raw_path = OUTPUT_ROOT / "raw" / f"{spider_name}.json"
    log_entry = {
        "spider": spider_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "completed" if result.returncode == 0 else "failed",
        "rawPath": str(raw_path),
        "normalizedPath": str(normalized_path),
        "stdoutTail": result.stdout[-2000:],
        "stderrTail": result.stderr[-2000:],
    }
    append_run_log(log_entry)

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"Spider {spider_name} failed")

    return {
        "spider": spider_name,
        "rawPath": str(raw_path),
        "normalizedPath": str(normalized_path),
    }


def append_run_log(entry):
    LOGS_ROOT.mkdir(parents=True, exist_ok=True)
    with (LOGS_ROOT / "runs.log").open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry) + "\n")


def load_jobs(normalized_path):
    if not normalized_path.exists():
        return []
    return json.loads(normalized_path.read_text(encoding="utf-8"))


def ingest_jobs(spider_name, jobs):
    base_url = os.getenv("WORKWISE_API_BASE_URL", "http://localhost:3001")
    token = os.getenv("SCRAPING_INGEST_TOKEN")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["x-ingest-token"] = token

    try:
        response = requests.post(
            f"{base_url.rstrip('/')}/api/v1/jobs/ingest",
            headers=headers,
            json=jobs,
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        append_run_log(
            {
                "spider": spider_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ingestSummary": payload,
            }
        )
        return payload
    except Exception as exc:
        retry_dir = OUTPUT_ROOT / "retry"
        retry_dir.mkdir(parents=True, exist_ok=True)
        retry_path = retry_dir / f"{spider_name}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        retry_path.write_text(json.dumps(jobs, indent=2), encoding="utf-8")
        append_run_log(
            {
                "spider": spider_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "retryPath": str(retry_path),
                "retryReason": str(exc),
            }
        )
        raise


def aggregate_report(results, ingest_enabled):
    source_readiness = get_source_readiness_summary()
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "statistics": {
            "spidersRun": len(results),
            "jobsScraped": 0,
            "jobsReadyForIngest": 0,
            "jobsInserted": 0,
            "jobsDuplicates": 0,
            "jobsFailed": 0,
            "errors": 0,
        },
        "sources": results,
        "sourceReadiness": source_readiness,
        "ingestEnabled": ingest_enabled,
    }

    for result in results:
        normalized_path = result.get("normalizedPath")
        jobs = load_jobs(Path(normalized_path)) if normalized_path else []
        report["statistics"]["jobsScraped"] += len(jobs)
        report["statistics"]["jobsReadyForIngest"] += len(jobs)
        if "ingestSummary" in result:
            report["statistics"]["jobsInserted"] += result["ingestSummary"].get("inserted", 0)
            report["statistics"]["jobsDuplicates"] += result["ingestSummary"].get("duplicates", 0)
            report["statistics"]["jobsFailed"] += result["ingestSummary"].get("failed", 0)
            report["statistics"]["errors"] += len(result["ingestSummary"].get("errors", []))
        if result.get("error"):
            report["statistics"]["errors"] += 1

    report_path = PROJECT_ROOT / f"scraping_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report, report_path


def main():
    configure_logging()
    args = parse_args()
    ingest_enabled = str(args.ingest).lower() == "true"
    spiders = selected_spiders(args.source)
    results = []

    logger.info("Starting scraping run for spiders: %s", ", ".join(spiders))

    for spider in spiders:
        source_name = source_name_for_spider(spider)
        try:
            registry_entry = enforce_source_rollout(
                source_name,
                ingest_enabled=ingest_enabled,
                concurrency=args.concurrent,
                allow_unverified=args.allow_unverified,
            )
            logger.info(
                "Legal registry check passed for source %s with status %s and rollout %s",
                source_name,
                registry_entry.get("approvalStatus"),
                registry_entry.get("rolloutStage"),
            )
        except SourceRegistryError as exc:
            logger.error("Legal registry blocked source %s: %s", source_name, exc)
            return 1

    with ThreadPoolExecutor(max_workers=max(1, args.concurrent)) as executor:
        futures = {
            executor.submit(run_spider, spider, args.max_items): spider for spider in spiders
        }
        for future in as_completed(futures):
            spider = futures[future]
            try:
                result = future.result()
                jobs = load_jobs(Path(result["normalizedPath"]))
                result["jobsPrepared"] = len(jobs)
                if ingest_enabled and jobs:
                    result["ingestSummary"] = ingest_jobs(spider, jobs)
                results.append(result)
            except Exception as exc:
                logger.error("Spider %s failed: %s", spider, exc)
                results.append({"spider": spider, "error": str(exc)})

    report, report_path = aggregate_report(results, ingest_enabled)
    logger.info("Saved scraping report to %s", report_path)
    logger.info("Run summary: %s", json.dumps(report["statistics"]))
    return 0 if report["statistics"]["errors"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
