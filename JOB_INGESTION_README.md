# Job Ingestion Pipeline for WorkWise SA

## Overview

This system provides a comprehensive job ingestion pipeline that automatically scrapes job listings from various sources and ingests them into your WorkWise SA platform. The system is built around Python and integrates with your Netlify functions and PostgreSQL database via Drizzle ORM.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Job Sources   │    │  Python Pipeline │    │  Netlify Func   │
│                 │    │                  │    │                 │
│ • Indeed        │───▶│ • Scrapers       │───▶│ • jobsIngest    │
│ • LinkedIn      │    │ • Validation     │    │ • Validation    │
│ • Careers24     │    │ • Deduplication  │    │ • Upserts       │
│ • Manual Files  │    │ • Rate Limiting  │    │ • Error Handling│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   + Drizzle     │
                                               │                 │
                                               │ • Jobs Table    │
                                               │ • Companies     │
                                               │ • Categories    │
                                               └─────────────────┘
```

## 🚀 Features

- **Multi-source scraping**: Indeed, LinkedIn, Careers24, and manual file imports
- **Smart deduplication**: Uses externalId to prevent duplicate job listings
- **Rate limiting**: Respectful scraping with configurable delays
- **Validation**: Comprehensive data validation before ingestion
- **Bulk processing**: Efficient batch processing for large datasets
- **Error handling**: Robust error handling and logging
- **Monitoring**: Built-in metrics and health checks
- **Automation**: GitHub Actions for scheduled runs

## 📁 File Structure

```
├── netlify/functions/
│   └── jobsIngest.js          # Netlify function for job ingestion
├── scripts/
│   ├── job_ingestion.py       # Main Python ingestion pipeline
│   ├── config.py              # Configuration management
│   ├── requirements.txt       # Python dependencies
│   └── sample_jobs.json      # Sample job data for testing
├── shared/
│   └── schema.ts              # Updated Drizzle schema with ingestion fields
├── migrations/
│   └── 0006_add_job_ingestion_fields.sql  # Database migration
└── .github/workflows/
    └── job-ingestion.yml      # GitHub Actions automation
```

## 🔧 Setup & Installation

### 1. Database Migration

First, run the database migration to add the new ingestion fields:

```sql
-- Run this migration in your PostgreSQL database
-- Or use Drizzle to apply the schema changes
```

### 2. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the `scripts` directory:

```bash
# Netlify Configuration
NETLIFY_URL=https://your-site.netlify.app
API_KEY=your_api_key_here

# Pipeline Settings
BATCH_SIZE=100
MAX_RETRIES=3
RETRY_DELAY=5.0
TIMEOUT=300
LOG_LEVEL=INFO

# Scraper Configuration
ENABLE_INDEED=true
ENABLE_LINKEDIN=true
ENABLE_CAREERS24=false

# Rate Limiting
INDEED_DELAY=2.0
LINKEDIN_DELAY=3.0
CAREERS24_DELAY=2.5

# Manual Jobs
MANUAL_JOBS_FILE=sample_jobs.json

# Notifications (Optional)
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_NOTIFICATIONS=false
```

### 4. GitHub Secrets

For the GitHub Actions workflow, add these secrets:

- `NETLIFY_URL`: Your Netlify site URL
- `API_KEY`: Your API key for authentication
- `MANUAL_JOBS_FILE`: Path to manual jobs file (if using)
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications (optional)

## 🎯 Usage

### Manual Run

```bash
cd scripts
python job_ingestion.py
```

### GitHub Actions

The pipeline runs automatically:
- **Daily at 2 AM UTC** (scheduled)
- **On push to main** (for testing)
- **Manual trigger** (workflow_dispatch)

### Configuration

The system is highly configurable through environment variables:

```python
from config import get_config

config = get_config()
print(f"Enabled scrapers: {config.get_enabled_scrapers()}")
print(f"Batch size: {config.batch_size}")
```

## 📊 Data Flow

### 1. Job Scraping

```python
# Indeed Scraper
indeed_scraper = IndeedScraper()
jobs = await indeed_scraper.scrape_jobs()

# LinkedIn Scraper
linkedin_scraper = LinkedInScraper()
jobs = await linkedin_scraper.scrape_jobs()
```

### 2. Data Validation

```python
# Each job is validated for required fields
required_fields = ['title', 'company', 'location', 'description']
for field in required_fields:
    if not job.get(field):
        errors.append(f"Missing required field: {field}")
```

### 3. Deduplication

```python
# Generate unique external ID
external_id = hashlib.md5(
    f"{title}{company}{location}".encode()
).hexdigest()

# Check if job already exists
existing = await db.query(
    'SELECT id FROM jobs WHERE external_id = $1',
    [external_id]
)
```

### 4. Ingestion

```python
# Send to Netlify function
payload = {
    "items": job_data,
    "source": source
}

response = await session.post(
    f"{netlify_url}/jobsIngest",
    json=payload
)
```

## 🔍 Monitoring & Logging

### Logs

Logs are written to both file and console:

```bash
# View logs
tail -f scripts/job_ingestion.log

# Log levels: DEBUG, INFO, WARNING, ERROR
```

### Metrics

The system provides built-in metrics:

- Jobs scraped per source
- Success/failure rates
- Processing times
- Error counts

### Health Checks

```bash
# Check pipeline health
curl https://your-site.netlify.app/.netlify/functions/jobsIngest
```

## 🧪 Testing

### Sample Data

Use the provided sample data for testing:

```bash
# Test with sample jobs
MANUAL_JOBS_FILE=sample_jobs.json python job_ingestion.py
```

### Dry Run Mode

The GitHub Actions workflow supports dry-run mode for testing:

```yaml
# In GitHub Actions
- name: Dry Run
  run: |
    python job_ingestion.py --dry-run
```

## 🚨 Error Handling

### Common Issues

1. **Rate Limiting**: Respect source rate limits
2. **Network Errors**: Automatic retries with exponential backoff
3. **Validation Errors**: Detailed error messages for debugging
4. **Database Errors**: Transaction rollback on failures

### Error Recovery

```python
try:
    await pipeline.ingest_jobs(jobs, source)
except Exception as e:
    logger.error(f"Failed to ingest jobs: {e}")
    # Jobs are logged and can be retried
```

## 🔒 Security & Compliance

### Rate Limiting

- Configurable delays between requests
- Respect for robots.txt
- User-Agent identification

### Data Privacy

- No personal information stored
- Job data only (title, company, location, description)
- Configurable data retention

### Compliance

- Respects website terms of service
- Configurable scraping limits
- Ethical scraping practices

## 🚀 Production Deployment

### 1. Environment Setup

```bash
# Production environment
export NETLIFY_URL=https://your-production-site.netlify.app
export API_KEY=your_production_api_key
export LOG_LEVEL=WARNING
```

### 2. Monitoring

```bash
# Set up monitoring
export ENABLE_METRICS=true
export METRICS_PORT=9090
export ALERT_THRESHOLD=5
```

### 3. Scaling

- Increase batch sizes for higher throughput
- Add more scrapers for additional sources
- Implement distributed processing for large datasets

## 🔮 Future Enhancements

### Planned Features

- **Real-time scraping**: WebSocket-based live job updates
- **AI-powered filtering**: Machine learning for job relevance
- **Advanced analytics**: Job market insights and trends
- **Multi-language support**: International job markets
- **API endpoints**: REST API for external integrations

### Custom Scrapers

Add new job sources by extending the `JobScraper` class:

```python
class CustomScraper(JobScraper):
    def __init__(self):
        super().__init__("custom")
    
    async def scrape_jobs(self) -> List[JobListing]:
        # Implement custom scraping logic
        pass
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Authentication Errors**: Check API key and permissions
2. **Rate Limiting**: Increase delays between requests
3. **Database Errors**: Verify database connection and schema
4. **Network Issues**: Check firewall and proxy settings

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python job_ingestion.py
```

### Getting Help

1. Check the logs for detailed error messages
2. Verify configuration and environment variables
3. Test with sample data first
4. Check GitHub Actions logs for automation issues

## 📚 API Reference

### Netlify Function: jobsIngest

**Endpoint**: `POST /.netlify/functions/jobsIngest`

**Request Body**:
```json
{
  "items": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "description": "Job Description",
      "salary": "Salary Range",
      "jobType": "Full-time",
      "workMode": "Remote",
      "externalId": "unique_id",
      "isFeatured": false
    }
  ],
  "source": "indeed"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Job ingestion completed",
  "stats": {
    "totalReceived": 10,
    "totalProcessed": 10,
    "inserted": 8,
    "updated": 2,
    "errors": 0
  }
}
```

### Python Classes

#### JobListing
```python
@dataclass
class JobListing:
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
```

#### JobIngestionPipeline
```python
class JobIngestionPipeline:
    async def ingest_jobs(self, jobs: List[JobListing], source: str) -> Dict[str, Any]
```

## 🎉 Conclusion

This job ingestion pipeline provides a robust, scalable solution for automatically populating your WorkWise SA platform with job listings from multiple sources. The system is designed to be:

- **Reliable**: Comprehensive error handling and retry logic
- **Scalable**: Configurable batch processing and rate limiting
- **Maintainable**: Clean code structure and comprehensive documentation
- **Secure**: Rate limiting and ethical scraping practices
- **Automated**: GitHub Actions integration for hands-off operation

Start with the sample data and gradually enable more scrapers as you become comfortable with the system. Monitor the logs and metrics to ensure optimal performance and adjust configuration as needed.

---

**Happy job ingesting! 🚀**
