import json
from pathlib import Path


REGISTRY_PATH = Path(__file__).resolve().parents[1] / "config" / "source-registry.json"


class SourceRegistryError(Exception):
    pass


def load_source_registry():
    if not REGISTRY_PATH.exists():
        raise SourceRegistryError(f"Missing source registry: {REGISTRY_PATH}")

    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_source(source_name, allow_unverified=False):
    registry = load_source_registry()
    source = registry.get(source_name)

    if not source:
        raise SourceRegistryError(f"Source {source_name} is not registered")

    if not source.get("enabled"):
        raise SourceRegistryError(f"Source {source_name} is disabled in the legal registry")

    if source.get("approvalStatus") != "reviewed" and not allow_unverified:
        raise SourceRegistryError(
            f"Source {source_name} is not approved for scraping. Pass allow_unverified to bypass."
        )

    return source


def get_source_readiness_summary():
    registry = load_source_registry()
    return {
        source_name: {
            "enabled": source.get("enabled", False),
            "approvalStatus": source.get("approvalStatus", "unknown"),
            "robotsCheckedAt": source.get("robotsCheckedAt"),
        }
        for source_name, source in registry.items()
    }


def enforce_source_rollout(source_name, ingest_enabled=False, concurrency=1, allow_unverified=False):
    source = validate_source(source_name, allow_unverified=allow_unverified)

    rollout_stage = source.get("rolloutStage", "blocked")
    allow_ingest = bool(source.get("allowIngest", False))
    max_concurrency = int(source.get("maxConcurrency", 1))

    if rollout_stage == "blocked":
        raise SourceRegistryError(f"Source {source_name} is blocked for rollout")

    if ingest_enabled and not allow_ingest:
        raise SourceRegistryError(
            f"Source {source_name} is not approved for ingest at rollout stage {rollout_stage}"
        )

    if concurrency > max_concurrency:
        raise SourceRegistryError(
            f"Source {source_name} allows max concurrency {max_concurrency}, received {concurrency}"
        )

    return source
