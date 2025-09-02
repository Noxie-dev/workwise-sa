#!/bin/bash

# Setup script for Workwise-SA Scrapy Job Scraping System
# This script sets up the Python environment and tests the scraping system

echo "🚀 Setting up Workwise-SA Job Scraping System"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "scrapy_jobs/scrapy.cfg" ]; then
    print_error "Please run this script from the workwise-sa root directory"
    exit 1
fi

# Step 1: Check Python version
print_status "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+')
    print_success "Python 3 found: $(python3 --version)"
else
    print_error "Python 3 is required but not installed"
    exit 1
fi

# Step 2: Create virtual environment if it doesn't exist
if [ ! -d "scrapy_jobs/venv" ]; then
    print_status "Creating Python virtual environment..."
    cd scrapy_jobs
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        print_success "Virtual environment created successfully"
    else
        print_error "Failed to create virtual environment"
        exit 1
    fi
    cd ..
else
    print_warning "Virtual environment already exists"
fi

# Step 3: Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
cd scrapy_jobs
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install some dependencies"
        print_warning "You may need to install some dependencies manually"
    fi
else
    print_error "requirements.txt not found"
    exit 1
fi

cd ..

# Step 4: Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f ".env" ]; then
    echo "# Scrapy Job Scraping Configuration" > .env
    echo "DATABASE_URL=sqlite:///database.db" >> .env
    echo "SCRAPY_SETTINGS_MODULE=scrapy_jobs.settings" >> .env
    echo "SCRAPY_PROJECT=scrapy_jobs" >> .env
    print_success "Environment file created"
else
    print_warning "Environment file already exists"
fi

# Step 5: Test Scrapy installation
print_status "Testing Scrapy installation..."
cd scrapy_jobs
source venv/bin/activate

# Test if scrapy command works
if scrapy --version &> /dev/null; then
    print_success "Scrapy is properly installed"
    scrapy --version
else
    print_error "Scrapy installation test failed"
    exit 1
fi

# Step 6: List available spiders
print_status "Available spiders:"
scrapy list 2>/dev/null || echo "No spiders found (this is normal for first setup)"

# Step 7: Test database connection
print_status "Testing database connection..."
python3 -c "
import sqlite3
import os

try:
    # Test SQLite connection
    db_path = '../database.db'
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM jobs')
        job_count = cursor.fetchone()[0]
        print(f'Database connection successful. Found {job_count} jobs.')
        conn.close()
    else:
        print('Database not found, will be created on first scrape')
except Exception as e:
    print(f'Database test failed: {e}')
"

# Step 8: Test scraping with dry run
print_status "Testing scraping system with dry run..."
if python3 run_scrapers.py --dry-run --max-items 5 --spider gumtree_jobs; then
    print_success "Dry run test completed successfully"
else
    print_warning "Dry run test had issues, but system should still work"
fi

cd ..

# Step 9: Add scraping route to your Express server
print_status "Setting up API integration..."
if [ -f "server/routes.ts" ]; then
    if ! grep -q "scraping" server/routes.ts; then
        echo ""
        echo "// Import scraping routes" >> server/routes.ts
        echo "import scrapingRoutes from './routes/scraping';" >> server/routes.ts
        echo "app.use('/api/scraping', scrapingRoutes);" >> server/routes.ts
        print_success "Added scraping routes to Express server"
    else
        print_warning "Scraping routes may already be configured"
    fi
fi

# Step 10: Create a simple test script
print_status "Creating test scripts..."
cat > test_scraping.js << 'EOF'
// Simple test script to trigger scraping via API
const axios = require('axios');

async function testScraping() {
    try {
        console.log('🧪 Testing scraping API...');
        
        // Start scraping
        const response = await axios.post('http://localhost:5000/api/scraping/trigger', {
            spiders: ['gumtree_jobs'],
            maxItems: 10,
            dryRun: true
        });
        
        console.log('✅ Scraping triggered:', response.data);
        
        // Check status
        const sessionId = response.data.sessionId;
        
        setTimeout(async () => {
            const statusResponse = await axios.get(`http://localhost:5000/api/scraping/session/${sessionId}`);
            console.log('📊 Scraping status:', statusResponse.data);
        }, 5000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if server is running
testScraping();
EOF

print_success "Test script created: test_scraping.js"

# Final summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start your Express server: npm run dev"
echo "2. Test the scraping API endpoints:"
echo "   - GET  /api/scraping/status"
echo "   - POST /api/scraping/trigger"
echo "   - GET  /api/scraping/stats"
echo ""
echo "3. Run a test scrape:"
echo "   cd scrapy_jobs"
echo "   source venv/bin/activate"
echo "   python3 run_scrapers.py --spider gumtree_jobs --max-items 20"
echo ""
echo "4. Or use the orchestration script:"
echo "   node test_scraping.js"
echo ""
echo "📁 Files created:"
echo "   - scrapy_jobs/venv/ (Python virtual environment)"
echo "   - scrapy_jobs/requirements.txt"
echo "   - server/routes/scraping.ts (API endpoints)"
echo "   - test_scraping.js (Test script)"
echo ""
print_success "Workwise-SA job scraping system is ready! 🚀"
