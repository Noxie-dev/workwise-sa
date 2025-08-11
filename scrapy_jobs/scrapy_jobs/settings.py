# Scrapy settings for scrapy_jobs project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html
#     https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#     https://docs.scrapy.org/en/latest/topics/spider-middleware.html

BOT_NAME = 'scrapy_jobs'

SPIDER_MODULES = ['scrapy_jobs.spiders']
NEWSPIDER_MODULE = 'scrapy_jobs.spiders'

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Configure a delay for requests for the same website (default: 0)
DOWNLOAD_DELAY = 2
RANDOMIZE_DOWNLOAD_DELAY = True

# Configure maximum concurrent requests performed by Scrapy (default: 16)
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 2

# AutoThrottle Extension
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0

# User-Agent
USER_AGENT = 'workwise-sa-job-scraper/1.0 (+http://www.workwise-sa.com)'

# Enable and configure the AutoThrottle extension (disabled by default)
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600
HTTPCACHE_DIR = 'httpcache'
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Configure pipelines
ITEM_PIPELINES = {
    'scrapy_jobs.pipelines.ValidationPipeline': 100,
    'scrapy_jobs.pipelines.DeduplicationPipeline': 200,
    'scrapy_jobs.pipelines.DatabasePipeline': 300,
}

# Configure middlewares (disabled for initial testing)
# DOWNLOADER_MIDDLEWARES = {
#     'scrapy_jobs.middlewares.RotateUserAgentMiddleware': 400,
#     'scrapy_jobs.middlewares.ProxyMiddleware': 500,
# }

# Database settings
DATABASE_URL = 'sqlite:///database.db'  # Will be overridden by environment variable
DATABASE_POOL_SIZE = 10

# Logging
LOG_LEVEL = 'INFO'
LOG_FILE = 'scrapy_jobs.log'

# Retry settings
RETRY_TIMES = 3
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Request fingerprinting implementation
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'

# Set settings whose default value is deprecated to a future-proof value
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'
FEED_EXPORT_ENCODING = 'utf-8'
