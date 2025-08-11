import logging
import hashlib
import sqlite3
import psycopg2
from datetime import datetime
from urllib.parse import urlparse
import os
import sys
import json

# Add the parent directory to Python path to import from workwise-sa
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from scrapy.exceptions import DropItem
from scrapy_jobs.items import JobItem, CompanyItem

logger = logging.getLogger(__name__)


class ValidationPipeline:
    """Validate scraped items before processing"""
    
    def process_item(self, item, spider):
        # Validate required fields for JobItem
        if isinstance(item, JobItem):
            required_fields = ['title', 'company_name', 'source_url']
            for field in required_fields:
                if not item.get(field):
                    raise DropItem(f"Missing required field '{field}' in job: {item.get('title', 'Unknown')}")
            
            # Validate job title length
            if len(item.get('title', '')) > 200:
                raise DropItem(f"Job title too long: {item['title'][:50]}...")
            
            # Validate description length
            if item.get('description') and len(item['description']) > 5000:
                item['description'] = item['description'][:4997] + "..."
            
            # Set default values
            item.setdefault('scraped_at', datetime.utcnow().isoformat())
            item.setdefault('work_mode', 'On-site')
            item.setdefault('job_type', 'Full-time')
            item.setdefault('is_featured', False)
            item.setdefault('is_urgent', False)
        
        # Validate required fields for CompanyItem
        elif isinstance(item, CompanyItem):
            required_fields = ['name', 'source_url']
            for field in required_fields:
                if not item.get(field):
                    raise DropItem(f"Missing required field '{field}' in company: {item.get('name', 'Unknown')}")
            
            item.setdefault('scraped_at', datetime.utcnow().isoformat())
        
        return item


class DeduplicationPipeline:
    """Remove duplicate items based on content hash"""
    
    def __init__(self):
        self.seen_items = set()
    
    def process_item(self, item, spider):
        # Create a hash of the item's key fields
        if isinstance(item, JobItem):
            # Create hash from title, company, and location
            key_string = f"{item.get('title', '')}-{item.get('company_name', '')}-{item.get('location', '')}"
            item_hash = hashlib.md5(key_string.encode('utf-8')).hexdigest()
        elif isinstance(item, CompanyItem):
            # Create hash from company name and website
            key_string = f"{item.get('name', '')}-{item.get('website', '')}"
            item_hash = hashlib.md5(key_string.encode('utf-8')).hexdigest()
        else:
            return item
        
        if item_hash in self.seen_items:
            raise DropItem(f"Duplicate item found: {item_hash}")
        else:
            self.seen_items.add(item_hash)
            return item


class CategoryMappingPipeline:
    """Map job titles to categories using ML-based classification"""
    
    def __init__(self):
        # Define category mappings based on keywords
        self.category_mappings = {
            1: ['cashier', 'teller', 'sales', 'retail', 'store', 'shop'],  # Retail
            2: ['general', 'worker', 'labourer', 'helper', 'assistant', 'warehouse'],  # General Worker
            3: ['security', 'guard', 'protection', 'surveillance'],  # Security
            4: ['petrol', 'fuel', 'attendant', 'service station'],  # Petrol Attendant
            5: ['nanny', 'childcare', 'babysitter', 'au pair'],  # Childcare
            6: ['cleaner', 'cleaning', 'janitor', 'housekeeping', 'domestic'],  # Cleaning
            7: ['gardener', 'landscaping', 'grounds', 'maintenance', 'garden']  # Landscaping
        }
    
    def classify_job_category(self, title, description=''):
        """Classify job into a category based on title and description"""
        text = f"{title} {description}".lower()
        
        # Score each category
        category_scores = {}
        for category_id, keywords in self.category_mappings.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                category_scores[category_id] = score
        
        if category_scores:
            # Return category with highest score
            return max(category_scores.items(), key=lambda x: x[1])[0]
        
        # Default to General Worker if no category matches
        return 2
    
    def process_item(self, item, spider):
        if isinstance(item, JobItem):
            # Only set category if not already set
            if not item.get('category_id'):
                category_id = self.classify_job_category(
                    item.get('title', ''),
                    item.get('description', '')
                )
                item['category_id'] = category_id
        
        return item


class DatabasePipeline:
    """Save items to the workwise-sa database"""
    
    def __init__(self, database_url=None):
        self.database_url = database_url or os.getenv('DATABASE_URL', 'sqlite:///database.db')
        self.connection = None
    
    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            database_url=crawler.settings.get('DATABASE_URL')
        )
    
    def open_spider(self, spider):
        """Initialize database connection when spider opens"""
        try:
            if self.database_url.startswith('sqlite'):
                db_path = self.database_url.replace('sqlite:///', '')
                self.connection = sqlite3.connect(db_path)
                self.connection.row_factory = sqlite3.Row
            elif self.database_url.startswith('postgresql'):
                self.connection = psycopg2.connect(self.database_url)
            
            logger.info(f"Connected to database: {self.database_url}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def close_spider(self, spider):
        """Close database connection when spider closes"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def process_item(self, item, spider):
        """Process and save item to database"""
        try:
            if isinstance(item, JobItem):
                self._save_job_item(item, spider)
            elif isinstance(item, CompanyItem):
                self._save_company_item(item, spider)
            
            logger.debug(f"Saved item: {item.get('title') or item.get('name')}")
            return item
            
        except Exception as e:
            logger.error(f"Error saving item: {e}")
            # Don't drop the item, just log the error
            return item
    
    def _save_job_item(self, item, spider):
        """Save job item to database"""
        cursor = self.connection.cursor()
        
        try:
            # First, find or create the company
            company_id = self._get_or_create_company(item.get('company_name'))
            item['company_id'] = company_id
            
            # Check if job already exists (by external_id or unique combination)
            if item.get('external_id'):
                cursor.execute(
                    "SELECT id FROM jobs WHERE source_site = ? AND external_id = ?",
                    (item.get('source_site'), item.get('external_id'))
                )
            else:
                # Fallback to title + company combination
                cursor.execute(
                    """SELECT id FROM jobs 
                       WHERE LOWER(title) = LOWER(?) 
                       AND companyId = ? 
                       AND LOWER(location) = LOWER(?)""",
                    (item.get('title'), company_id, item.get('location', ''))
                )
            
            existing_job = cursor.fetchone()
            
            if existing_job:
                # Update existing job
                self._update_job(cursor, existing_job[0], item)
                logger.debug(f"Updated existing job: {item['title']}")
            else:
                # Insert new job
                self._insert_job(cursor, item)
                logger.debug(f"Inserted new job: {item['title']}")
            
            self.connection.commit()
            
        except Exception as e:
            logger.error(f"Error saving job item: {e}")
            self.connection.rollback()
            raise
        finally:
            cursor.close()
    
    def _get_or_create_company(self, company_name):
        """Get existing company ID or create new company"""
        if not company_name:
            return None
        
        cursor = self.connection.cursor()
        
        try:
            # Check if company exists
            cursor.execute("SELECT id FROM companies WHERE LOWER(name) = LOWER(?)", (company_name,))
            result = cursor.fetchone()
            
            if result:
                return result[0]
            
            # Create new company
            slug = company_name.lower().replace(' ', '-').replace('&', 'and')
            cursor.execute(
                """INSERT INTO companies (name, slug, logo, location, openPositions, createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (company_name, slug, 'default-logo.svg', 'South Africa', 1, 
                 datetime.utcnow().isoformat(), datetime.utcnow().isoformat())
            )
            
            company_id = cursor.lastrowid
            logger.info(f"Created new company: {company_name} (ID: {company_id})")
            return company_id
            
        finally:
            cursor.close()
    
    def _insert_job(self, cursor, item):
        """Insert new job into database"""
        cursor.execute(
            """INSERT INTO jobs (
                title, description, location, salary, jobType, workMode,
                companyId, categoryId, isFeatured, source_url, source_site,
                external_id, apply_url, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item.get('title'),
                item.get('description'),
                item.get('location'),
                item.get('salary'),
                item.get('job_type', 'Full-time'),
                item.get('work_mode', 'On-site'),
                item.get('company_id'),
                item.get('category_id', 2),  # Default to General Worker
                item.get('is_featured', False),
                item.get('source_url'),
                item.get('source_site'),
                item.get('external_id'),
                item.get('apply_url'),
                datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            )
        )
    
    def _update_job(self, cursor, job_id, item):
        """Update existing job in database"""
        cursor.execute(
            """UPDATE jobs SET 
                description = ?, location = ?, salary = ?, jobType = ?, workMode = ?,
                isFeatured = ?, source_url = ?, apply_url = ?, updatedAt = ?
                WHERE id = ?""",
            (
                item.get('description'),
                item.get('location'),
                item.get('salary'),
                item.get('job_type', 'Full-time'),
                item.get('work_mode', 'On-site'),
                item.get('is_featured', False),
                item.get('source_url'),
                item.get('apply_url'),
                datetime.utcnow().isoformat(),
                job_id
            )
        )
    
    def _save_company_item(self, item, spider):
        """Save company item to database"""
        cursor = self.connection.cursor()
        
        try:
            # Check if company already exists
            cursor.execute("SELECT id FROM companies WHERE LOWER(name) = LOWER(?)", (item['name'],))
            existing_company = cursor.fetchone()
            
            if existing_company:
                # Update existing company
                cursor.execute(
                    """UPDATE companies SET 
                        logo = COALESCE(?, logo),
                        location = COALESCE(?, location),
                        openPositions = COALESCE(?, openPositions),
                        updatedAt = ?
                        WHERE id = ?""",
                    (
                        item.get('logo'),
                        item.get('location'),
                        item.get('open_positions'),
                        datetime.utcnow().isoformat(),
                        existing_company[0]
                    )
                )
                logger.debug(f"Updated existing company: {item['name']}")
            else:
                # Insert new company
                slug = item['name'].lower().replace(' ', '-').replace('&', 'and')
                cursor.execute(
                    """INSERT INTO companies (name, slug, logo, location, openPositions, createdAt, updatedAt)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        item['name'],
                        slug,
                        item.get('logo', 'default-logo.svg'),
                        item.get('location', 'South Africa'),
                        item.get('open_positions', 1),
                        datetime.utcnow().isoformat(),
                        datetime.utcnow().isoformat()
                    )
                )
                logger.debug(f"Inserted new company: {item['name']}")
            
            self.connection.commit()
            
        except Exception as e:
            logger.error(f"Error saving company item: {e}")
            self.connection.rollback()
            raise
        finally:
            cursor.close()


class StatsPipeline:
    """Pipeline to track scraping statistics"""
    
    def __init__(self):
        self.stats = {
            'jobs_scraped': 0,
            'jobs_saved': 0,
            'companies_scraped': 0,
            'companies_saved': 0,
            'errors': 0
        }
    
    def process_item(self, item, spider):
        if isinstance(item, JobItem):
            self.stats['jobs_scraped'] += 1
            self.stats['jobs_saved'] += 1
        elif isinstance(item, CompanyItem):
            self.stats['companies_scraped'] += 1
            self.stats['companies_saved'] += 1
        
        return item
    
    def close_spider(self, spider):
        """Log statistics when spider closes"""
        logger.info("Scraping Statistics:")
        for key, value in self.stats.items():
            logger.info(f"  {key}: {value}")
        
        # Save stats to file
        stats_file = f"scrapy_stats_{spider.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(stats_file, 'w') as f:
            json.dump(self.stats, f, indent=2)
