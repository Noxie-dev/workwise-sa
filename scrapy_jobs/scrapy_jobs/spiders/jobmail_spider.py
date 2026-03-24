import json
import re
from datetime import datetime
from html import unescape
from urllib.parse import urljoin

import scrapy
from itemloaders import ItemLoader
from scrapy import Request

from scrapy_jobs.items import JobItem


class JobMailJobsSpider(scrapy.Spider):
    name = "jobmail_jobs"
    allowed_domains = ["jobmail.co.za"]

    start_urls = [
        "https://www.jobmail.co.za/jobs/general-employment",
        "https://www.jobmail.co.za/jobs/security",
        "https://www.jobmail.co.za/jobs/cleaning-domestic",
        "https://www.jobmail.co.za/jobs/warehouse",
    ]

    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
    }

    def parse(self, response):
        job_links = response.css("a[href*='/jobs/'][href*='-id-']::attr(href)").getall()
        seen = set()
        for job_link in job_links:
            if job_link in seen:
                continue
            seen.add(job_link)
            job_url = urljoin(response.url, job_link)
            yield Request(job_url, callback=self.parse_job_detail, meta={"source_site": "jobmail"})

        next_page = response.css("link[rel='next']::attr(href), a[rel='next']::attr(href)").get()
        if next_page:
            yield Request(urljoin(response.url, next_page), callback=self.parse)

    def parse_job_detail(self, response):
        ad_data = self.extract_ad_data(response.text)

        title = (
            ad_data.get("JobTitle")
            or response.css("meta[property='og:title']::attr(content)").get(default="").replace(" | Job Mail", "")
        )
        location = ad_data.get("Location") or self.extract_location(response)
        company_name = ad_data.get("CompanyName") or "Private Employer"
        description = self.extract_description(response.text)
        salary_text = self.extract_salary(ad_data)
        source_url = response.url
        external_id = self.extract_external_id(source_url)
        posted_at = self.extract_posted_at(response.text)

        loader = ItemLoader(item=JobItem(), response=response)
        loader.add_value("title", title)
        loader.add_value("description", description)
        loader.add_value("companyName", company_name)
        loader.add_value("location", location)
        loader.add_value("salaryText", salary_text)
        loader.add_value("jobType", self.extract_job_type(response.text))
        loader.add_value("workMode", None)
        loader.add_value("sourceSite", "jobmail")
        loader.add_value("sourceUrl", source_url)
        loader.add_value("externalId", external_id)
        loader.add_value("postedAt", posted_at)
        loader.add_value("applyUrl", source_url)
        loader.add_value(
            "rawData",
            {
                "title": title,
                "description": description,
                "companyName": company_name,
                "location": location,
                "salaryText": salary_text,
                "jobType": self.extract_job_type(response.text),
                "workMode": None,
                "sourceSite": "jobmail",
                "sourceUrl": source_url,
                "externalId": external_id,
                "postedAt": posted_at,
                "applyUrl": source_url,
            },
        )

        yield loader.load_item()

    def extract_ad_data(self, html):
        match = re.search(r"var ad = (\{.*?\});", html, re.DOTALL)
        if not match:
            return {}
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return {}

    def extract_description(self, html):
        match = re.search(r'"description":\s*"((?:[^"\\]|\\.)*)"', html)
        if not match:
            meta_description = re.search(r'<meta name="description" content="([^"]+)"', html)
            return unescape(meta_description.group(1)).strip() if meta_description else ""

        encoded = match.group(1).encode("utf-8").decode("unicode_escape")
        cleaned = re.sub(r"<[^>]+>", " ", unescape(encoded))
        return re.sub(r"\s+", " ", cleaned).strip()

    def extract_salary(self, ad_data):
        min_salary = ad_data.get("MinSalary") or ad_data.get("ApproxMonthlyMinSalary")
        max_salary = ad_data.get("MaxSalary") or ad_data.get("ApproxMonthlyMaxSalary")
        salary_info = ad_data.get("SalaryInfo")
        salary_time = ad_data.get("SalaryTime")

        if salary_info:
            return salary_info
        if min_salary and max_salary:
            return f"R{int(min_salary)} - R{int(max_salary)} {salary_time.lower() if salary_time else ''}".strip()
        return None

    def extract_job_type(self, html):
        match = re.search(r'<meta name="description" content="([^"]+)"', html)
        if not match:
            return None
        description = match.group(1).upper()
        if "PART TIME" in description:
            return "Part-time"
        if "CONTRACT" in description:
            return "Contract"
        return "Full-time"

    def extract_location(self, response):
        breadcrumb_items = response.css("#BreadcrumbList::text").get()
        if breadcrumb_items and "Kempton Park" in breadcrumb_items:
            return "Kempton Park"

        meta_description = response.css("meta[name='description']::attr(content)").get()
        if meta_description:
            match = re.search(r"\sin\s(.+?)\sas advertised", meta_description)
            if match:
                return match.group(1).strip()

        return "South Africa"

    def extract_posted_at(self, html):
        match = re.search(r'"datePosted":\s*"([^"]+)"', html)
        if not match:
            return datetime.utcnow().isoformat()
        return match.group(1)

    def extract_external_id(self, url):
        match = re.search(r"-id-(\d+)", url)
        return match.group(1) if match else url.rstrip("/").split("/")[-1]
