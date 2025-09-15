#!/usr/bin/env python3
"""
Job Scraping Orchestration Script for Workwise-SA

This script manages the job scraping process, including:
- Running multiple spiders
- Data processing and validation
- Database integration
- Algorithm updates
- Monitoring and logging
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from pathlib import Path
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from twisted.internet import reactor, defer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_scraping.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class JobScrapingOrchestrator:
    """Main orchestrator for job scraping operations"""
    
    def __init__(self, config_file=None):
        self.config = self.load_config(config_file)
        self.stats = {
            'scrapers_run': 0,
            'jobs_scraped': 0,
            'jobs_processed': 0,
            'errors': 0,
            'start_time': datetime.now().isoformat(),
        }
        
    def load_config(self, config_file=None):
        """Load configuration from file or use defaults"""
        default_config = {
            'spiders': [
                'gumtree_jobs',
                # Add more spiders as they're created
                # 'indeed_jobs',
                # 'careers24_jobs',
                # 'pnet_jobs'
            ],
            'concurrent_spiders': 2,
            'database_url': os.getenv('DATABASE_URL', 'sqlite:///database.db'),
            'output_format': 'database',  # or 'json', 'csv'
            'enable_algorithms': True,
            'update_metrics': True,
            'max_items_per_spider': 1000,
            'scraping_session_id': datetime.now().strftime('%Y%m%d_%H%M%S'),
        }
        
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                default_config.update(user_config)
            except Exception as e:
                logger.error(f"Error loading config file: {e}")
        
        return default_config\n    \n    def run_spider(self, spider_name):\n        \"\"\"Run a single spider\"\"\"\n        logger.info(f\"Starting spider: {spider_name}\")\n        \n        try:\n            # Use subprocess to run scrapy in isolation\n            cmd = [\n                'scrapy', 'crawl', spider_name,\n                '-s', f'SCRAPING_SESSION_ID={self.config[\"scraping_session_id\"]}',\n                '-s', f'DATABASE_URL={self.config[\"database_url\"]}',\n                '-s', f'CLOSESPIDER_ITEMCOUNT={self.config[\"max_items_per_spider\"]}',\n                '-L', 'INFO'\n            ]\n            \n            # Change to scrapy project directory\n            scrapy_dir = Path(__file__).parent\n            result = subprocess.run(\n                cmd, \n                cwd=scrapy_dir,\n                capture_output=True, \n                text=True, \n                timeout=3600  # 1 hour timeout\n            )\n            \n            if result.returncode == 0:\n                logger.info(f\"Spider {spider_name} completed successfully\")\n                return {'spider': spider_name, 'status': 'success', 'output': result.stdout}\n            else:\n                logger.error(f\"Spider {spider_name} failed: {result.stderr}\")\n                return {'spider': spider_name, 'status': 'error', 'error': result.stderr}\n                \n        except subprocess.TimeoutExpired:\n            logger.error(f\"Spider {spider_name} timed out\")\n            return {'spider': spider_name, 'status': 'timeout'}\n        except Exception as e:\n            logger.error(f\"Error running spider {spider_name}: {e}\")\n            return {'spider': spider_name, 'status': 'error', 'error': str(e)}\n    \n    def run_all_spiders(self):\n        \"\"\"Run all configured spiders concurrently\"\"\"\n        logger.info(f\"Starting {len(self.config['spiders'])} spiders\")\n        \n        results = []\n        \n        # Run spiders concurrently\n        with ThreadPoolExecutor(max_workers=self.config['concurrent_spiders']) as executor:\n            future_to_spider = {\n                executor.submit(self.run_spider, spider): spider \n                for spider in self.config['spiders']\n            }\n            \n            for future in as_completed(future_to_spider):\n                spider = future_to_spider[future]\n                try:\n                    result = future.result()\n                    results.append(result)\n                    self.stats['scrapers_run'] += 1\n                    \n                    if result['status'] == 'success':\n                        logger.info(f\"✓ Spider {spider} completed\")\n                    else:\n                        logger.error(f\"✗ Spider {spider} failed\")\n                        self.stats['errors'] += 1\n                        \n                except Exception as e:\n                    logger.error(f\"Exception in spider {spider}: {e}\")\n                    self.stats['errors'] += 1\n        \n        return results\n    \n    def update_company_metrics(self):\n        \"\"\"Update company hiring metrics after scraping\"\"\"\n        if not self.config.get('update_metrics', True):\n            return\n            \n        logger.info(\"Updating company hiring metrics...\")\n        \n        try:\n            # This would integrate with your existing topHiringAlgorithm.ts\n            # For now, we'll create a simple Python equivalent\n            self.calculate_hiring_metrics()\n            logger.info(\"Company metrics updated successfully\")\n        except Exception as e:\n            logger.error(f\"Error updating company metrics: {e}\")\n    \n    def calculate_hiring_metrics(self):\n        \"\"\"Calculate and update hiring metrics for companies\"\"\"\n        # This integrates with your existing algorithm\n        # Import your database connection\n        try:\n            import sqlite3\n            \n            db_path = self.config['database_url'].replace('sqlite:///', '')\n            conn = sqlite3.connect(db_path)\n            cursor = conn.cursor()\n            \n            # Get companies with job counts\n            cursor.execute(\"\"\"\n                SELECT c.id, c.name, COUNT(j.id) as open_positions,\n                       COUNT(CASE WHEN j.createdAt > datetime('now', '-30 days') THEN 1 END) as recent_jobs\n                FROM companies c\n                LEFT JOIN jobs j ON c.id = j.companyId\n                GROUP BY c.id, c.name\n            \"\"\")\n            \n            companies = cursor.fetchall()\n            \n            # Update company metrics\n            for company_id, name, open_positions, recent_jobs in companies:\n                # Calculate hiring score (simplified version of your algorithm)\n                hiring_score = min(open_positions * 2 + recent_jobs * 5, 100)\n                \n                cursor.execute(\n                    \"UPDATE companies SET openPositions = ?, hiringScore = ? WHERE id = ?\",\n                    (open_positions, hiring_score, company_id)\n                )\n            \n            conn.commit()\n            conn.close()\n            \n            logger.info(f\"Updated metrics for {len(companies)} companies\")\n            \n        except Exception as e:\n            logger.error(f\"Error calculating hiring metrics: {e}\")\n    \n    def run_job_classification(self):\n        \"\"\"Run job classification algorithms on newly scraped jobs\"\"\"\n        if not self.config.get('enable_algorithms', True):\n            return\n            \n        logger.info(\"Running job classification algorithms...\")\n        \n        try:\n            # This would integrate with your ML classification algorithms\n            # For now, it's handled in the CategoryMappingPipeline\n            logger.info(\"Job classification completed\")\n        except Exception as e:\n            logger.error(f\"Error in job classification: {e}\")\n    \n    def generate_report(self, results):\n        \"\"\"Generate a scraping report\"\"\"\n        self.stats['end_time'] = datetime.now().isoformat()\n        \n        report = {\n            'session_id': self.config['scraping_session_id'],\n            'statistics': self.stats,\n            'spider_results': results,\n            'config': self.config\n        }\n        \n        # Save report\n        report_file = f\"scraping_report_{self.config['scraping_session_id']}.json\"\n        with open(report_file, 'w') as f:\n            json.dump(report, f, indent=2)\n        \n        # Log summary\n        logger.info(\"\\n\" + \"=\"*50)\n        logger.info(\"SCRAPING SESSION SUMMARY\")\n        logger.info(\"=\"*50)\n        logger.info(f\"Session ID: {self.config['scraping_session_id']}\")\n        logger.info(f\"Spiders Run: {self.stats['scrapers_run']}\")\n        logger.info(f\"Errors: {self.stats['errors']}\")\n        logger.info(f\"Report saved to: {report_file}\")\n        logger.info(\"=\"*50)\n        \n        return report\n    \n    def run(self):\n        \"\"\"Main execution method\"\"\"\n        logger.info(\"Starting job scraping orchestration...\")\n        \n        try:\n            # Run all spiders\n            results = self.run_all_spiders()\n            \n            # Post-processing\n            self.update_company_metrics()\n            self.run_job_classification()\n            \n            # Generate report\n            report = self.generate_report(results)\n            \n            logger.info(\"Job scraping orchestration completed successfully\")\n            return report\n            \n        except Exception as e:\n            logger.error(f\"Fatal error in orchestration: {e}\")\n            self.stats['errors'] += 1\n            raise\n\n\ndef main():\n    \"\"\"CLI entry point\"\"\"\n    parser = argparse.ArgumentParser(description='Workwise-SA Job Scraping Orchestrator')\n    parser.add_argument('--config', '-c', help='Configuration file path')\n    parser.add_argument('--spider', '-s', help='Run specific spider only')\n    parser.add_argument('--max-items', '-m', type=int, help='Maximum items per spider')\n    parser.add_argument('--concurrent', type=int, default=2, help='Number of concurrent spiders')\n    parser.add_argument('--dry-run', action='store_true', help='Test run without saving to database')\n    \n    args = parser.parse_args()\n    \n    # Create orchestrator\n    orchestrator = JobScrapingOrchestrator(args.config)\n    \n    # Override config with CLI args\n    if args.spider:\n        orchestrator.config['spiders'] = [args.spider]\n    if args.max_items:\n        orchestrator.config['max_items_per_spider'] = args.max_items\n    if args.concurrent:\n        orchestrator.config['concurrent_spiders'] = args.concurrent\n    if args.dry_run:\n        orchestrator.config['database_url'] = ':memory:'  # Use in-memory database\n    \n    try:\n        report = orchestrator.run()\n        sys.exit(0 if orchestrator.stats['errors'] == 0 else 1)\n    except KeyboardInterrupt:\n        logger.info(\"Scraping interrupted by user\")\n        sys.exit(2)\n    except Exception as e:\n        logger.error(f\"Fatal error: {e}\")\n        sys.exit(1)\n\n\nif __name__ == '__main__':\n    main()"
