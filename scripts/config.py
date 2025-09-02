"""
Configuration file for the Job Ingestion Pipeline
"""

import os
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ScraperConfig:
    """Configuration for individual scrapers"""
    name: str
    enabled: bool
    search_terms: List[str]
    locations: List[str]
    delay_between_requests: float
    max_jobs_per_search: int
    rate_limit_per_minute: int

@dataclass
class PipelineConfig:
    """Main pipeline configuration"""
    netlify_url: str
    api_key: str
    batch_size: int
    max_retries: int
    retry_delay: float
    timeout: int
    log_level: str

class Config:
    """Main configuration class"""
    
    def __init__(self):
        # Netlify configuration
        self.netlify_url = os.getenv('NETLIFY_URL', 'http://localhost:8888')
        self.api_key = os.getenv('API_KEY', '')
        
        # Pipeline settings
        self.batch_size = int(os.getenv('BATCH_SIZE', '100'))
        self.max_retries = int(os.getenv('MAX_RETRIES', '3'))
        self.retry_delay = float(os.getenv('RETRY_DELAY', '5.0'))
        self.timeout = int(os.getenv('TIMEOUT', '300'))
        self.log_level = os.getenv('LOG_LEVEL', 'INFO')
        
        # Manual jobs file
        self.manual_jobs_file = os.getenv('MANUAL_JOBS_FILE', 'sample_jobs.json')
        
        # Scraper configurations
        self.scrapers = {
            'indeed': ScraperConfig(
                name='indeed',
                enabled=os.getenv('ENABLE_INDEED', 'true').lower() == 'true',
                search_terms=[
                    "software developer", "frontend developer", "backend developer",
                    "data scientist", "product manager", "ui ux designer",
                    "devops engineer", "full stack developer", "python developer",
                    "react developer", "node.js developer", "java developer",
                    "machine learning engineer", "data engineer", "cloud engineer"
                ],
                locations=[
                    "Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth",
                    "Bloemfontein", "East London", "Kimberley", "Nelspruit", "Polokwane"
                ],
                delay_between_requests=float(os.getenv('INDEED_DELAY', '2.0')),
                max_jobs_per_search=int(os.getenv('INDEED_MAX_JOBS', '50')),
                rate_limit_per_minute=int(os.getenv('INDEED_RATE_LIMIT', '30'))
            ),
            
            'linkedin': ScraperConfig(
                name='linkedin',
                enabled=os.getenv('ENABLE_LINKEDIN', 'true').lower() == 'true',
                search_terms=[
                    "software engineer", "data analyst", "project manager",
                    "business analyst", "marketing manager", "sales representative",
                    "product owner", "scrum master", "technical lead", "architect",
                    "qa engineer", "test engineer", "support engineer"
                ],
                locations=[
                    "South Africa", "Cape Town", "Johannesburg", "Durban", "Pretoria",
                    "Port Elizabeth", "Bloemfontein", "East London", "Kimberley"
                ],
                delay_between_requests=float(os.getenv('LINKEDIN_DELAY', '3.0')),
                max_jobs_per_search=int(os.getenv('LINKEDIN_MAX_JOBS', '40')),
                rate_limit_per_minute=int(os.getenv('LINKEDIN_RATE_LIMIT', '20'))
            ),
            
            'careers24': ScraperConfig(
                name='careers24',
                enabled=os.getenv('ENABLE_CAREERS24', 'false').lower() == 'true',
                search_terms=[
                    "developer", "engineer", "analyst", "manager", "specialist",
                    "consultant", "coordinator", "assistant", "director", "executive"
                ],
                locations=[
                    "Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth"
                ],
                delay_between_requests=float(os.getenv('CAREERS24_DELAY', '2.5')),
                max_jobs_per_search=int(os.getenv('CAREERS24_MAX_JOBS', '30')),
                rate_limit_per_minute=int(os.getenv('CAREERS24_RATE_LIMIT', '25'))
            )
        }
        
        # Database configuration (for local processing if needed)
        self.database = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5432')),
            'name': os.getenv('DB_NAME', 'workwise'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', ''),
            'ssl_mode': os.getenv('DB_SSL_MODE', 'prefer')
        }
        
        # Notification settings
        self.notifications = {
            'slack_webhook': os.getenv('SLACK_WEBHOOK_URL', ''),
            'email_enabled': os.getenv('EMAIL_NOTIFICATIONS', 'false').lower() == 'true',
            'email_recipients': os.getenv('EMAIL_RECIPIENTS', '').split(','),
            'smtp_server': os.getenv('SMTP_SERVER', ''),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'smtp_user': os.getenv('SMTP_USER', ''),
            'smtp_password': os.getenv('SMTP_PASSWORD', '')
        }
        
        # Monitoring and metrics
        self.monitoring = {
            'enable_metrics': os.getenv('ENABLE_METRICS', 'true').lower() == 'true',
            'metrics_port': int(os.getenv('METRICS_PORT', '9090')),
            'health_check_url': os.getenv('HEALTH_CHECK_URL', ''),
            'alert_threshold': int(os.getenv('ALERT_THRESHOLD', '10'))  # Max errors before alert
        }
    
    def get_enabled_scrapers(self) -> List[ScraperConfig]:
        """Get list of enabled scrapers"""
        return [config for config in self.scrapers.values() if config.enabled]
    
    def get_scraper_config(self, name: str) -> ScraperConfig:
        """Get configuration for a specific scraper"""
        return self.scrapers.get(name)
    
    def validate(self) -> List[str]:
        """Validate configuration and return list of errors"""
        errors = []
        
        if not self.netlify_url:
            errors.append("NETLIFY_URL is required")
        
        if not self.api_key:
            errors.append("API_KEY is required")
        
        if self.batch_size <= 0:
            errors.append("BATCH_SIZE must be positive")
        
        if self.max_retries < 0:
            errors.append("MAX_RETRIES must be non-negative")
        
        if self.timeout <= 0:
            errors.append("TIMEOUT must be positive")
        
        # Check if at least one scraper is enabled
        enabled_scrapers = self.get_enabled_scrapers()
        if not enabled_scrapers:
            errors.append("At least one scraper must be enabled")
        
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'netlify_url': self.netlify_url,
            'batch_size': self.batch_size,
            'max_retries': self.max_retries,
            'retry_delay': self.retry_delay,
            'timeout': self.timeout,
            'log_level': self.log_level,
            'enabled_scrapers': [s.name for s in self.get_enabled_scrapers()],
            'manual_jobs_file': self.manual_jobs_file
        }

# Global configuration instance
config = Config()

def get_config() -> Config:
    """Get the global configuration instance"""
    return config
