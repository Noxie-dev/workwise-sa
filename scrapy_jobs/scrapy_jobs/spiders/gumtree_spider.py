import scrapy
from scrapy import Request
from urllib.parse import urljoin
import re
from datetime import datetime, timedelta
from itemloaders import ItemLoader

from scrapy_jobs.items import JobItem, CompanyItem


class GumtreeJobsSpider(scrapy.Spider):
    """Spider to scrape jobs from Gumtree South Africa focusing on entry-level positions"""
    
    name = 'gumtree_jobs'
    allowed_domains = ['gumtree.co.za']
    
    # Start URLs for different job categories (entry-level jobs focus)
    start_urls = [
        'https://www.gumtree.co.za/s-jobs/v1c8p1',  # All jobs
        'https://www.gumtree.co.za/s-admin-office-clerical/v1c8034p1',  # Admin/Office
        'https://www.gumtree.co.za/s-domestic-jobs/v1c8038p1',  # Domestic jobs
        'https://www.gumtree.co.za/s-general-jobs/v1c8039p1',  # General jobs
        'https://www.gumtree.co.za/s-hospitality-jobs/v1c8040p1',  # Hospitality
        'https://www.gumtree.co.za/s-retail-jobs/v1c8045p1',  # Retail
        'https://www.gumtree.co.za/s-security-jobs/v1c8046p1',  # Security
        'https://www.gumtree.co.za/s-warehouse-jobs/v1c8048p1',  # Warehouse
    ]
    
    custom_settings = {
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    def start_requests(self):
        """Generate initial requests"""
        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        for url in self.start_urls:
            yield Request(
                url=url,
                headers=headers,
                callback=self.parse_job_listings,
                dont_filter=True
            )
    
    def parse_job_listings(self, response):
        """Parse job listing pages"""
        
        # Extract job links - Gumtree uses various selectors
        job_links = response.css('a.related-ad-title::attr(href)').getall()
        if not job_links:
            job_links = response.css('.listing-link::attr(href)').getall()
        if not job_links:
            job_links = response.css('[data-testid=\"listing-link\"]::attr(href)').getall()
        
        self.logger.info(f'Found {len(job_links)} job links on {response.url}')
        # Follow each job link
        for job_link in job_links:
            job_url = urljoin(response.url, job_link)
            yield Request(
                url=job_url,
                callback=self.parse_job_detail,
                meta={'source_site': 'gumtree'}
            )
        
        # Follow pagination
        next_page = response.css('a[aria-label=\"Next page\"]::attr(href)').get()
        if not next_page:
            next_page = response.css('.pagination-next::attr(href)').get()
        
        if next_page:
            next_url = urljoin(response.url, next_page)
            self.logger.info(f'Following next page: {next_url}')
            yield Request(
                url=next_url,
                callback=self.parse_job_listings,
                dont_filter=True
            )
    
    def parse_job_detail(self, response):
        """Parse individual job detail pages"""
        
        loader = ItemLoader(item=JobItem(), response=response)
        
        # Basic job information
        title = response.css('h1.myAdTitle::text').get()
        if not title:
            title = response.css('[data-testid="ad-title"]::text').get()
        if not title:
            title = response.css('.ad-title::text').get()
        
        loader.add_value('title', title)
        
        # Job description
        description_parts = response.css('.ad-description p::text, .ad-description div::text, .ad-description::text').getall()
        if not description_parts:
            description_parts = response.css('[data-testid="ad-description"] *::text').getall()
        
        description = ' '.join(description_parts).strip()
        loader.add_value('description', description)
        
        # Company information
        company_name = self.extract_company_name(response, description)
        loader.add_value('company_name', company_name)
        
        # Location
        location = response.css('.ad-location::text').get()
        if not location:
            location = response.css('[data-testid="ad-location"]::text').get()
        if not location:
            # Try to extract from breadcrumbs or other location indicators
            location_breadcrumb = response.css('.breadcrumb li:last-child::text').get()
            if location_breadcrumb and location_breadcrumb != 'Jobs':
                location = location_breadcrumb
        
        loader.add_value('location', location or 'South Africa')
        
        # Extract salary if mentioned in description
        salary = self.extract_salary(description)
        if salary:
            loader.add_value('salary', salary)
        
        # Job type and work mode
        job_type, work_mode = self.classify_job_type(title, description)
        loader.add_value('job_type', job_type)
        loader.add_value('work_mode', work_mode)
        
        # Posted date
        posted_date = self.extract_posted_date(response)
        if posted_date:
            loader.add_value('posted_date', posted_date)
        
        # Source information
        loader.add_value('source_url', response.url)
        loader.add_value('source_site', 'gumtree')
        
        # Extract external ID from URL
        external_id = self.extract_external_id(response.url)
        if external_id:
            loader.add_value('external_id', external_id)
        
        # Apply URL (usually the same as source URL for Gumtree)
        loader.add_value('apply_url', response.url)
        
        # Check if it's a featured/urgent post
        is_featured = bool(response.css('.featured, .urgent, .top-ad').get())
        loader.add_value('is_featured', is_featured)
        
        yield loader.load_item()
    
    def extract_company_name(self, response, description):
        """Extract company name from various sources"""
        # Try to get from seller info
        company = response.css('.vip-seller-name::text, .seller-name::text').get()
        
        if not company:
            # Try to extract from description using common patterns
            company_patterns = [
                r'Company[:\s]+([A-Za-z\s&]+)',
                r'Employer[:\s]+([A-Za-z\s&]+)',
                r'([A-Za-z\s&]+)\s+is\s+looking\s+for',
                r'Join\s+([A-Za-z\s&]+)',
                r'([A-Za-z\s&]+)\s+seeks?',
            ]
            
            for pattern in company_patterns:
                match = re.search(pattern, description, re.IGNORECASE)
                if match:
                    company = match.group(1).strip()
                    break
        
        if not company or len(company) < 2:
            company = "Private Employer"
        
        # Clean up company name
        company = re.sub(r'\s+', ' ', company).strip()
        return company[:100]  # Limit length
    
    def extract_salary(self, text):
        """Extract salary information from text"""
        if not text:
            return None
        
        # South African salary patterns
        salary_patterns = [
            r'R\s*\d{1,3}[,\s]*\d{3}(?:[,\s]*\d{3})?(?:\s*[-–]\s*R?\s*\d{1,3}[,\s]*\d{3}(?:[,\s]*\d{3})?)?(?:\s*per\s*month|pm|/month)?',
            r'\d{1,3}[,\s]*\d{3}(?:[,\s]*\d{3})?\s*[-–]\s*\d{1,3}[,\s]*\d{3}(?:[,\s]*\d{3})?(?:\s*per\s*month|pm)',
            r'salary[:\s]*R?\s*\d{1,3}[,\s]*\d{3}(?:[,\s]*\d{3})?',
        ]
        
        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        
        return None
    
    def classify_job_type(self, title, description):
        """Classify job type and work mode based on title and description"""
        text = f"{title} {description}".lower() if title and description else ""
        
        # Job type classification
        if any(word in text for word in ['part time', 'part-time', 'weekend', 'casual']):
            job_type = 'Part-time'
        elif any(word in text for word in ['contract', 'temporary', 'temp', 'fixed term']):
            job_type = 'Contract'
        elif any(word in text for word in ['internship', 'intern', 'learnership']):
            job_type = 'Internship'
        else:
            job_type = 'Full-time'
        
        # Work mode classification
        if any(word in text for word in ['remote', 'work from home', 'wfh', 'online']):
            work_mode = 'Remote'
        elif any(word in text for word in ['hybrid', 'flexible']):
            work_mode = 'Hybrid'
        else:
            work_mode = 'On-site'
        
        return job_type, work_mode
    
    def extract_posted_date(self, response):
        """Extract posting date from the page"""
        # Try different date selectors
        date_text = response.css('.ad-date::text, .creation-date::text, [data-testid="ad-date"]::text').get()
        
        if date_text:
            # Parse relative dates like "2 days ago", "1 week ago"
            if 'day' in date_text.lower():
                days_match = re.search(r'(\d+)\s*days?\s*ago', date_text.lower())
                if days_match:
                    days_ago = int(days_match.group(1))
                    return (datetime.now() - timedelta(days=days_ago)).isoformat()
            elif 'week' in date_text.lower():
                weeks_match = re.search(r'(\d+)\s*weeks?\s*ago', date_text.lower())
                if weeks_match:
                    weeks_ago = int(weeks_match.group(1))
                    return (datetime.now() - timedelta(weeks=weeks_ago)).isoformat()
            elif 'hour' in date_text.lower():
                hours_match = re.search(r'(\d+)\s*hours?\s*ago', date_text.lower())
                if hours_match:
                    hours_ago = int(hours_match.group(1))
                    return (datetime.now() - timedelta(hours=hours_ago)).isoformat()
            elif 'today' in date_text.lower():
                return datetime.now().isoformat()
            elif 'yesterday' in date_text.lower():
                return (datetime.now() - timedelta(days=1)).isoformat()
        
        # Default to current date
        return datetime.now().isoformat()
    
    def extract_external_id(self, url):
        """Extract external ID from Gumtree URL"""
        # Gumtree URLs typically contain an ID like: /a-jobs/city/ad-title/1001234567890
        match = re.search(r'/(\d{10,})/?$', url)
        if match:
            return match.group(1)
        return None
    
    def parse(self, response):
        """Default parse method - delegate to parse_job_listings"""
        return self.parse_job_listings(response)
