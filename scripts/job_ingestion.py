#!/usr/bin/env python3
"""
Job Ingestion Pipeline for WorkWise SA
Scrapes job data from various sources and ingests them into the platform
"""

import asyncio
import aiohttp
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import hashlib
from urllib.parse import urljoin, urlparse
import time
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_ingestion.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class JobListing:
    """Represents a job listing from external sources"""
    title: str
    company: str
    location: str
    description: str
    salary: Optional[str] = None
    jobType: Optional[str] = None
    workMode: Optional[str] = None
    externalId: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    postedAt: Optional[datetime] = None
    isFeatured: bool = False

class JobIngestionPipeline:
    """Main pipeline for ingesting jobs from various sources"""
    
    def __init__(self, netlify_url: str, api_key: Optional[str] = None):
        self.netlify_url = netlify_url
        self.api_key = api_key
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers={
                'User-Agent': 'WorkWise-SA-JobIngestion/1.0',
                'Content-Type': 'application/json'
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def ingest_jobs(self, jobs: List[JobListing], source: str = "manual") -> Dict[str, Any]:
        """Ingest jobs into the platform via Netlify function"""
        if not jobs:
            logger.warning("No jobs to ingest")
            return {"success": False, "message": "No jobs to ingest"}
        
        # Prepare jobs for ingestion
        job_data = []
        for job in jobs:
            job_dict = asdict(job)
            # Convert datetime to ISO string
            if job_dict.get('postedAt'):
                job_dict['postedAt'] = job_dict['postedAt'].isoformat()
            # Remove None values
            job_dict = {k: v for k, v in job_dict.items() if v is not None}
            job_data.append(job_dict)
        
        payload = {
            "items": job_data,
            "source": source
        }
        
        try:
            async with self.session.post(
                f"{self.netlify_url}/jobsIngest",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)  # 5 minutes timeout
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"Successfully ingested {len(jobs)} jobs from {source}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to ingest jobs: {response.status} - {error_text}")
                    return {"success": False, "error": error_text, "status": response.status}
                    
        except Exception as e:
            logger.error(f"Error ingesting jobs: {e}")
            return {"success": False, "error": str(e)}

class JobScraper:
    """Base class for job scrapers"""
    
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.logger = logging.getLogger(f"scraper.{source_name}")
    
    async def scrape_jobs(self) -> List[JobListing]:
        """Scrape jobs from the source - to be implemented by subclasses"""
        raise NotImplementedError
    
    def generate_external_id(self, job_data: Dict[str, Any]) -> str:
        """Generate a unique external ID for deduplication"""
        # Create a hash from title + company + location
        unique_string = f"{job_data.get('title', '')}{job_data.get('company', '')}{job_data.get('location', '')}"
        return hashlib.md5(unique_string.encode()).hexdigest()

class IndeedScraper(JobScraper):
    """Scraper for Indeed job listings"""
    
    def __init__(self):
        super().__init__("indeed")
        self.base_url = "https://za.indeed.com"
        self.search_terms = [
            "software developer", "frontend developer", "backend developer",
            "data scientist", "product manager", "ui ux designer",
            "devops engineer", "full stack developer", "python developer"
        ]
        self.locations = ["Cape Town", "Johannesburg", "Durban", "Pretoria"]
    
    async def scrape_jobs(self) -> List[JobListing]:
        """Scrape jobs from Indeed (simulated for demo)"""
        jobs = []
        
        # Simulate scraping - in production, you'd implement actual web scraping
        for search_term in self.search_terms[:3]:  # Limit for demo
            for location in self.locations[:2]:  # Limit for demo
                # Simulate finding some jobs
                for i in range(random.randint(2, 5)):
                    job = JobListing(
                        title=f"{search_term.title()} - {i+1}",
                        company=f"Company {i+1}",
                        location=location,
                        description=f"We are looking for a {search_term} in {location}. This is a great opportunity...",
                        salary=f"R{random.randint(20000, 80000):,} per month",
                        jobType=random.choice(["Full-time", "Part-time", "Contract"]),
                        workMode=random.choice(["Remote", "On-site", "Hybrid"]),
                        source=self.source_name,
                        postedAt=datetime.now() - timedelta(days=random.randint(0, 30))
                    )
                    job.externalId = self.generate_external_id(asdict(job))
                    jobs.append(job)
                
                # Add delay to be respectful
                await asyncio.sleep(1)
        
        self.logger.info(f"Scraped {len(jobs)} jobs from Indeed")
        return jobs

class LinkedInScraper(JobScraper):
    """Scraper for LinkedIn job listings"""
    
    def __init__(self):
        super().__init__("linkedin")
        self.search_terms = [
            "software engineer", "data analyst", "project manager",
            "business analyst", "marketing manager", "sales representative"
        ]
        self.locations = ["South Africa", "Cape Town", "Johannesburg"]
    
    async def scrape_jobs(self) -> List[JobListing]:
        """Scrape jobs from LinkedIn (simulated for demo)"""
        jobs = []
        
        # Simulate scraping
        for search_term in self.search_terms[:3]:
            for location in self.locations[:2]:
                for i in range(random.randint(1, 4)):
                    job = JobListing(
                        title=f"{search_term.title()} - {i+1}",
                        company=f"LinkedIn Company {i+1}",
                        location=location,
                        description=f"Join our team as a {search_term} in {location}. We offer competitive benefits...",
                        salary=f"R{random.randint(25000, 90000):,} per annum",
                        jobType=random.choice(["Full-time", "Contract"]),
                        workMode=random.choice(["Remote", "Hybrid", "On-site"]),
                        source=self.source_name,
                        postedAt=datetime.now() - timedelta(days=random.randint(0, 45))
                    )
                    job.externalId = self.generate_external_id(asdict(job))
                    jobs.append(job)
                
                await asyncio.sleep(1)
        
        self.logger.info(f"Scraped {len(jobs)} jobs from LinkedIn")
        return jobs

class ManualJobIngester:
    """For manually adding jobs or importing from CSV/JSON files"""
    
    def __init__(self, source_name: str = "manual"):
        self.source_name = source_name
        self.logger = logging.getLogger(f"ingester.{source_name}")
    
    async def ingest_from_file(self, file_path: str) -> List[JobListing]:
        """Ingest jobs from a JSON or CSV file"""
        jobs = []
        
        if file_path.endswith('.json'):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            for item in data:
                job = JobListing(
                    title=item.get('title', ''),
                    company=item.get('company', ''),
                    location=item.get('location', ''),
                    description=item.get('description', ''),
                    salary=item.get('salary'),
                    jobType=item.get('jobType'),
                    workMode=item.get('workMode'),
                    source=self.source_name
                )
                job.externalId = self.generate_external_id(asdict(job))
                jobs.append(job)
        
        self.logger.info(f"Loaded {len(jobs)} jobs from {file_path}")
        return jobs
    
    def generate_external_id(self, job_data: Dict[str, Any]) -> str:
        """Generate a unique external ID for deduplication"""
        unique_string = f"{job_data.get('title', '')}{job_data.get('company', '')}{job_data.get('location', '')}"
        return hashlib.md5(unique_string.encode()).hexdigest()

async def main():
    """Main function to run the job ingestion pipeline"""
    
    # Configuration
    netlify_url = os.getenv('NETLIFY_URL', 'http://localhost:8888')
    api_key = os.getenv('API_KEY')
    
    # Initialize scrapers
    scrapers = [
        IndeedScraper(),
        LinkedInScraper(),
    ]
    
    # Initialize manual ingester
    manual_ingester = ManualJobIngester()
    
    logger.info("Starting job ingestion pipeline...")
    
    async with JobIngestionPipeline(netlify_url, api_key) as pipeline:
        all_jobs = []
        
        # Scrape jobs from various sources
        for scraper in scrapers:
            try:
                logger.info(f"Scraping jobs from {scraper.source_name}...")
                jobs = await scraper.scrape_jobs()
                all_jobs.extend(jobs)
                
                # Ingest jobs from this source
                if jobs:
                    result = await pipeline.ingest_jobs(jobs, scraper.source_name)
                    if result.get('success'):
                        logger.info(f"Successfully ingested {len(jobs)} jobs from {scraper.source_name}")
                    else:
                        logger.error(f"Failed to ingest jobs from {scraper.source_name}: {result.get('error')}")
                
            except Exception as e:
                logger.error(f"Error scraping from {scraper.source_name}: {e}")
        
        # Check if we have a manual jobs file
        manual_jobs_file = os.getenv('MANUAL_JOBS_FILE')
        if manual_jobs_file and os.path.exists(manual_jobs_file):
            try:
                logger.info(f"Loading manual jobs from {manual_jobs_file}...")
                manual_jobs = await manual_ingester.ingest_from_file(manual_jobs_file)
                if manual_jobs:
                    result = await pipeline.ingest_jobs(manual_jobs, "manual")
                    if result.get('success'):
                        logger.info(f"Successfully ingested {len(manual_jobs)} manual jobs")
                    else:
                        logger.error(f"Failed to ingest manual jobs: {result.get('error')}")
            except Exception as e:
                logger.error(f"Error loading manual jobs: {e}")
        
        logger.info(f"Job ingestion pipeline completed. Total jobs processed: {len(all_jobs)}")

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
