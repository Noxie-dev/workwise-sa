import json
import logging
from pathlib import Path

from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem

from scrapy_jobs.middleware.compliance_middleware import ComplianceError, apply_compliance
from scrapy_jobs.utils.normalizer import normalize_job_item

logger = logging.getLogger(__name__)


class ArtifactPipeline:
    def __init__(self):
        self.raw_items = []
        self.normalized_items = []
        self.rejected = 0

    def open_spider(self, spider):
        project_root = Path(__file__).resolve().parents[1]
        self.output_root = project_root / "output"
        self.logs_root = project_root / "logs"
        self.raw_root = self.output_root / "raw"
        self.normalized_root = self.output_root / "normalized"

        self.raw_root.mkdir(parents=True, exist_ok=True)
        self.normalized_root.mkdir(parents=True, exist_ok=True)
        self.logs_root.mkdir(parents=True, exist_ok=True)

    def process_item(self, item, spider):
        data = ItemAdapter(item).asdict()
        raw_data = data.get("rawData") or dict(data)
        if isinstance(raw_data, list):
            raw_data = raw_data[0] if raw_data else {}
        data.pop("rawData", None)

        self.raw_items.append(raw_data)

        try:
            normalized = normalize_job_item(data)
            compliant = apply_compliance(normalized)
            self.normalized_items.append(compliant)
            return compliant
        except ComplianceError as exc:
            self.rejected += 1
            spider.crawler.stats.inc_value("compliance/rejected")
            self._log_error(spider.name, raw_data.get("sourceUrl"), str(exc))
            raise DropItem(str(exc)) from exc
        except Exception as exc:
            self.rejected += 1
            spider.crawler.stats.inc_value("pipeline/errors")
            self._log_error(spider.name, raw_data.get("sourceUrl"), str(exc))
            raise DropItem(f"Pipeline error: {exc}") from exc

    def close_spider(self, spider):
        raw_path = self.raw_root / f"{spider.name}.json"
        normalized_path = self.normalized_root / f"{spider.name}.json"

        raw_path.write_text(json.dumps(self.raw_items, indent=2, ensure_ascii=False))
        normalized_path.write_text(
            json.dumps(self.normalized_items, indent=2, ensure_ascii=False)
        )

        spider.crawler.stats.set_value("artifacts/raw_path", str(raw_path))
        spider.crawler.stats.set_value("artifacts/normalized_path", str(normalized_path))
        spider.crawler.stats.set_value("items/raw_count", len(self.raw_items))
        spider.crawler.stats.set_value("items/normalized_count", len(self.normalized_items))
        spider.crawler.stats.set_value("items/rejected_count", self.rejected)

    def _log_error(self, spider_name, source_url, message):
        error_log = self.logs_root / "errors.log"
        with error_log.open("a", encoding="utf-8") as handle:
            handle.write(
                json.dumps(
                    {
                        "spider": spider_name,
                        "sourceUrl": source_url,
                        "message": message,
                    }
                )
                + "\n"
            )
