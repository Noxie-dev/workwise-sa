#!/usr/bin/env python3
"""
Enhanced Job Ingestion Pipeline with Drizzle Best Practices

This enhanced version includes:
1. Better data validation and sanitization
2. Enhanced error handling and logging
3. Performance monitoring and metrics
4. Retry mechanisms for failed operations
5. Data quality checks before ingestion
"""

import asyncio
import aiohttp
import hashlib
import logging
import json
import time
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
from enum import Enum
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_job_ingestion.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class JobSource(Enum):
    """Enum for job sources"""
    INDEED = "indeed"
    LINKEDIN = "linkedin"
    MANUAL = "manual"
    TEST = "test"

class ValidationLevel(Enum):
    """Enum for validation levels"""
    STRICT = "strict"
    MODERATE = "moderate"
    LENIENT = "lenient"

@dataclass
class JobListing:
    """Enhanced job listing with validation"""
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
    
    def __post_init__(self):
        """Post-initialization validation and sanitization"""
        # Sanitize title
        if self.title:
            self.title = self.title.strip()[:255]  # Limit to 255 chars
        
        # Sanitize company name
        if self.company:
            self.company = self.company.strip()[:100]
        
        # Sanitize location
        if self.location:
            self.location = self.location.strip()[:100]
        
        # Sanitize description
        if self.description:
            self.description = self.description.strip()[:2000]
        
        # Generate external ID if not provided
        if not self.externalId:
            self.externalId = self._generate_external_id()
    
    def _generate_external_id(self) -> str:
        """Generate a unique external ID for deduplication"""
        unique_string = f"{self.title}{self.company}{self.location}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    def validate(self, level: ValidationLevel = ValidationLevel.MODERATE) -> List[str]:
        """Validate job listing data"""
        errors = []
        
        # Required fields
        if not self.title or len(self.title.strip()) < 3:
            errors.append("Title must be at least 3 characters long")
        
        if not self.company or len(self.company.strip()) < 2:
            errors.append("Company must be at least 2 characters long")
        
        if not self.location or len(self.location.strip()) < 2:
            errors.append("Location must be at least 2 characters long")
        
        if not self.description or len(self.description.strip()) < 10:
            errors.append("Description must be at least 10 characters long")
        
        # Strict validation
        if level == ValidationLevel.STRICT:
            if not self.salary:
                errors.append("Salary is required in strict mode")
            if not self.jobType:
                errors.append("Job type is required in strict mode")
            if not self.workMode:
                errors.append("Work mode is required in strict mode")
        
        # Moderate validation
        elif level == ValidationLevel.MODERATE:
            if self.salary and len(self.salary) > 100:
                errors.append("Salary description too long (max 100 chars)")
            if self.jobType and self.jobType not in ['Full-time', 'Part-time', 'Contract', 'Internship']:
                errors.append("Invalid job type")
            if self.workMode and self.workMode not in ['Remote', 'On-site', 'Hybrid']:
                errors.append("Invalid work mode")
        
        return errors

class EnhancedJobIngestionPipeline:
    """Enhanced job ingestion pipeline with Drizzle best practices"""
    
    def __init__(self, netlify_url: str, api_key: str, validation_level: ValidationLevel = ValidationLevel.MODERATE):
        self.netlify_url = netlify_url.rstrip('/')
        self.api_key = api_key
        self.validation_level = validation_level
        self.session: Optional[aiohttp.ClientSession] = None
        self.stats = {
            'total_processed': 0,
            'successful_ingestions': 0,
            'failed_ingestions': 0,
            'validation_errors': 0,
            'start_time': None,
            'end_time': None,
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'WorkWise-JobIngestion/1.0',
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            }
        )
        self.stats['start_time'] = datetime.now()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
        self.stats['end_time'] = datetime.now()
        self._log_final_stats()
    
    def _log_final_stats(self):
        """Log final ingestion statistics"""
        if self.stats['start_time'] and self.stats['end_time']:
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            rate = self.stats['total_processed'] / duration if duration > 0 else 0
            
            logger.info("🎯 Ingestion Pipeline Statistics:")
            logger.info(f"   Total Processed: {self.stats['total_processed']}")
            logger.info(f"   Successful: {self.stats['successful_ingestions']}")
            logger.info(f"   Failed: {self.stats['failed_ingestions']}")
            logger.info(f"   Validation Errors: {self.stats['validation_errors']}")
            logger.info(f"   Duration: {duration:.2f}s")
            logger.info(f"   Rate: {rate:.2f} jobs/second")
            logger.info(f"   Success Rate: {(self.stats['successful_ingestions']/self.stats['total_processed']*100):.1f}%" if self.stats['total_processed'] > 0 else "N/A")
    
    async def ingest_jobs(self, jobs: List[JobListing], source: str, retry_count: int = 3) -> Dict[str, Any]:
        """Ingest jobs with enhanced error handling and retries"""
        if not jobs:
            logger.warning("No jobs to ingest")
            return {"success": False, "message": "No jobs to ingest", "count": 0}
        
        # Validate jobs before ingestion
        valid_jobs, validation_errors = self._validate_jobs(jobs)
        self.stats['validation_errors'] += len(validation_errors)
        
        if not valid_jobs:
            logger.error(f"All jobs failed validation: {validation_errors}")
            return {"success": False, "message": "All jobs failed validation", "errors": validation_errors}
        
        logger.info(f"Processing {len(valid_jobs)} valid jobs from {len(jobs)} total jobs")
        
        # Transform jobs for API
        api_payload = self._prepare_api_payload(valid_jobs, source)
        
        # Attempt ingestion with retries
        for attempt in range(retry_count):
            try:
                result = await self._send_to_api(api_payload, source)
                if result["success"]:
                    self.stats['successful_ingestions'] += len(valid_jobs)
                    self.stats['total_processed'] += len(valid_jobs)
                    logger.info(f"Successfully ingested {len(valid_jobs)} jobs from {source}")
                    return result
                else:
                    logger.warning(f"API returned failure on attempt {attempt + 1}: {result}")
                    if attempt == retry_count - 1:
                        self.stats['failed_ingestions'] += len(valid_jobs)
                        return result
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                if attempt == retry_count - 1:
                    self.stats['failed_ingestions'] += len(valid_jobs)
                    raise
        
        return {"success": False, "message": "All retry attempts failed"}
    
    def _validate_jobs(self, jobs: List[JobListing]) -> tuple[List[JobListing], List[str]]:
        """Validate jobs and return valid ones with error list"""
        valid_jobs = []
        all_errors = []
        
        for i, job in enumerate(jobs):
            errors = job.validate(self.validation_level)
            if errors:
                error_msg = f"Job {i} validation errors: {', '.join(errors)}"
                all_errors.append(error_msg)
                logger.warning(error_msg)
            else:
                valid_jobs.append(job)
        
        return valid_jobs, all_errors
    
    def _prepare_api_payload(self, jobs: List[JobListing], source: str) -> Dict[str, Any]:
        """Prepare jobs for API ingestion"""
        payload = {
            "items": [
                {
                    "externalId": job.externalId,
                    "title": job.title,
                    "companyId": 1,  # Default company ID
                    "location": job.location,
                    "salary": job.salary,
                    "description": job.description,
                    "jobType": job.jobType or "Full-time",
                    "workMode": job.workMode or "On-site",
                    "categoryId": 1,  # Default category ID
                    "isFeatured": job.isFeatured,
                    "source": source,
                }
                for job in jobs
            ]
        }
        
        logger.debug(f"Prepared API payload with {len(payload['items'])} items")
        return payload
    
    async def _send_to_api(self, payload: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Send jobs to the Netlify function API"""
        if not self.session:
            raise RuntimeError("Session not initialized")
        
        url = f"{self.netlify_url}/.netlify/functions/jobsIngest"
        
        try:
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"API response: {result}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"API error {response.status}: {error_text}")
                    return {
                        "success": False,
                        "status": response.status,
                        "error": error_text
                    }
        except aiohttp.ClientError as e:
            logger.error(f"HTTP client error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

class EnhancedJobScraper:
    """Enhanced base job scraper with better error handling"""
    
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.logger = logging.getLogger(f"scraper.{source_name}")
        self.rate_limit_delay = 1.0  # Default delay between requests
    
    async def scrape_jobs(self) -> List[JobListing]:
        """Scrape jobs from the source - to be implemented by subclasses"""
        raise NotImplementedError
    
    def generate_external_id(self, job_data: Dict[str, Any]) -> str:
        """Generate a unique external ID for deduplication"""
        unique_string = f"{job_data.get('title', '')}{job_data.get('company', '')}{job_data.get('location', '')}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    async def _rate_limit(self):
        """Apply rate limiting to be respectful to sources"""
        await asyncio.sleep(self.rate_limit_delay)

class EnhancedIndeedScraper(EnhancedJobScraper):
    """Enhanced Indeed scraper with better error handling"""
    
    def __init__(self):
        super().__init__("indeed")
        self.base_url = "https://za.indeed.com"
        self.search_terms = [
            "software developer", "frontend developer", "backend developer",
            "data scientist", "product manager", "ui ux designer",
            "devops engineer", "full stack developer", "python developer"
        ]
        self.locations = ["Cape Town", "Johannesburg", "Durban", "Pretoria"]
        self.rate_limit_delay = 1.5  # Be more respectful to Indeed
    
    async def scrape_jobs(self) -> List[JobListing]:
        """Scrape jobs from Indeed with enhanced error handling"""
        jobs = []
        
        try:
            for search_term in self.search_terms[:3]:  # Limit for demo
                for location in self.locations[:2]:  # Limit for demo
                    try:
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
                            jobs.append(job)
                        
                        # Apply rate limiting
                        await self._rate_limit()
                        
                    except Exception as e:
                        self.logger.error(f"Error processing {search_term} in {location}: {e}")
                        continue
            
            self.logger.info(f"Scraped {len(jobs)} jobs from Indeed")
            return jobs
            
        except Exception as e:
            self.logger.error(f"Critical error in Indeed scraper: {e}")
            return []

class EnhancedLinkedInScraper(EnhancedJobScraper):
    """Enhanced LinkedIn scraper with better error handling"""
    
    def __init__(self):
        super().__init__("linkedin")
        self.search_terms = [
            "software engineer", "data analyst", "project manager",
            "business analyst", "marketing manager", "sales representative"
        ]
        self.locations = ["South Africa", "Cape Town", "Johannesburg"]
        self.rate_limit_delay = 2.0  # Be very respectful to LinkedIn
    
    async def scrape_jobs(self) -> List[JobListing]:
        """Scrape jobs from LinkedIn with enhanced error handling"""
        jobs = []
        
        try:
            for search_term in self.search_terms[:3]:
                for location in self.locations[:2]:
                    try:
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
                            jobs.append(job)
                        
                        # Apply rate limiting
                        await self._rate_limit()
                        
                    except Exception as e:
                        self.logger.error(f"Error processing {search_term} in {location}: {e}")
                        continue
            
            self.logger.info(f"Scraped {len(jobs)} jobs from LinkedIn")
            return jobs
            
        except Exception as e:
            self.logger.error(f"Critical error in LinkedIn scraper: {e}")
            return []

async def main():
    """Main function to run the enhanced job ingestion pipeline"""
    logger.info("🚀 Starting Enhanced Job Ingestion Pipeline...")
    
    # Configuration
    netlify_url = "https://your-site.netlify.app"  # Replace with actual URL
    api_key = "your-api-key"  # Replace with actual API key
    
    try:
        async with EnhancedJobIngestionPipeline(netlify_url, api_key, ValidationLevel.MODERATE) as pipeline:
            # Test with Indeed scraper
            logger.info("📊 Testing Indeed scraper...")
            indeed_scraper = EnhancedIndeedScraper()
            indeed_jobs = await indeed_scraper.scrape_jobs()
            
            if indeed_jobs:
                result = await pipeline.ingest_jobs(indeed_jobs, "indeed")
                logger.info(f"Indeed ingestion result: {result}")
            
            # Test with LinkedIn scraper
            logger.info("📊 Testing LinkedIn scraper...")
            linkedin_scraper = EnhancedLinkedInScraper()
            linkedin_jobs = await linkedin_scraper.scrape_jobs()
            
            if linkedin_jobs:
                result = await pipeline.ingest_jobs(linkedin_jobs, "linkedin")
                logger.info(f"LinkedIn ingestion result: {result}")
            
            logger.info("✅ Enhanced job ingestion pipeline completed successfully!")
            
    except Exception as e:
        logger.error(f"💥 Pipeline failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
