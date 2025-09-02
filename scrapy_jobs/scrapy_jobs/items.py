import scrapy
from scrapy import Item, Field
from itemloaders.processors import TakeFirst, MapCompose, Join
import re
from datetime import datetime


def clean_text(value):
    """Clean text by removing extra whitespace and newlines"""
    if value:
        return re.sub(r'\s+', ' ', value.strip())
    return value


def extract_salary_range(salary_text):
    """Extract salary range from text"""
    if not salary_text:
        return None
    
    # Remove common prefixes/suffixes
    salary_text = salary_text.lower()
    salary_text = re.sub(r'salary[:\s]*', '', salary_text)
    salary_text = re.sub(r'per month|/month|pm', '', salary_text)
    salary_text = re.sub(r'per annum|/annum|pa', '', salary_text)
    
    return salary_text.strip()


def parse_location(location):
    """Parse and standardize location"""
    if not location:
        return None
    
    # Clean location text
    location = clean_text(location)
    
    # Standardize common SA locations
    location_mappings = {
        'jhb': 'Johannesburg',
        'jozi': 'Johannesburg',
        'cpt': 'Cape Town',
        'ct': 'Cape Town',
        'dbn': 'Durban',
        'pta': 'Pretoria',
        'pe': 'Port Elizabeth',
        'gqeberha': 'Port Elizabeth',
        'bloem': 'Bloemfontein',
    }
    
    location_lower = location.lower()
    for abbrev, full_name in location_mappings.items():
        if abbrev in location_lower:
            return full_name
    
    return location


class JobItem(scrapy.Item):
    """Scrapy item for job data"""
    
    # Basic job information
    title = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    description = Field(
        input_processor=MapCompose(clean_text),
        output_processor=Join(' ')
    )
    
    # Company information
    company_name = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    company_logo = Field(
        output_processor=TakeFirst()
    )
    
    # Location and remote work
    location = Field(
        input_processor=MapCompose(parse_location),
        output_processor=TakeFirst()
    )
    work_mode = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    
    # Job details
    job_type = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    salary = Field(
        input_processor=MapCompose(extract_salary_range),
        output_processor=TakeFirst()
    )
    experience_level = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    
    # Requirements and skills
    requirements = Field(
        input_processor=MapCompose(clean_text),
        output_processor=Join(' ')
    )
    skills = Field()
    
    # Dates and metadata
    posted_date = Field(
        output_processor=TakeFirst()
    )
    closing_date = Field(
        output_processor=TakeFirst()
    )
    
    # Source information
    source_url = Field(
        output_processor=TakeFirst()
    )
    source_site = Field(
        output_processor=TakeFirst()
    )
    external_id = Field(
        output_processor=TakeFirst()
    )
    
    # Additional fields
    apply_url = Field(
        output_processor=TakeFirst()
    )
    is_featured = Field(
        output_processor=TakeFirst()
    )
    is_urgent = Field(
        output_processor=TakeFirst()
    )
    
    # Workwise-SA specific fields
    category_id = Field(
        output_processor=TakeFirst()
    )
    company_id = Field(
        output_processor=TakeFirst()
    )
    
    # Scraping metadata
    scraped_at = Field(
        output_processor=TakeFirst()
    )
    scraping_session_id = Field(
        output_processor=TakeFirst()
    )


class CompanyItem(scrapy.Item):
    """Scrapy item for company data"""
    
    # Basic company information
    name = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    description = Field(
        input_processor=MapCompose(clean_text),
        output_processor=Join(' ')
    )
    
    # Company details
    logo = Field(
        output_processor=TakeFirst()
    )
    website = Field(
        output_processor=TakeFirst()
    )
    location = Field(
        input_processor=MapCompose(parse_location),
        output_processor=TakeFirst()
    )
    industry = Field(
        input_processor=MapCompose(clean_text),
        output_processor=TakeFirst()
    )
    
    # Company metrics
    employee_count = Field(
        output_processor=TakeFirst()
    )
    founded_year = Field(
        output_processor=TakeFirst()
    )
    
    # Hiring information
    open_positions = Field(
        output_processor=TakeFirst()
    )
    is_actively_hiring = Field(
        output_processor=TakeFirst()
    )
    
    # Source information
    source_url = Field(
        output_processor=TakeFirst()
    )
    source_site = Field(
        output_processor=TakeFirst()
    )
    external_id = Field(
        output_processor=TakeFirst()
    )
    
    # Scraping metadata
    scraped_at = Field(
        output_processor=TakeFirst()
    )
    scraping_session_id = Field(
        output_processor=TakeFirst()
    )
