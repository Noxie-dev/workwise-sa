import json
import re
from html import unescape
from urllib.parse import urljoin

import scrapy
from itemloaders import ItemLoader
from scrapy import Request

from scrapy_jobs.items import JobItem


class BizcommunityJobsSpider(scrapy.Spider):
    name = "bizcommunity_jobs"
    allowed_domains = ["bizcommunity.com"]

    start_urls = [
        "https://www.bizcommunity.com/JobsOffered/196/1.html",
    ]

    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
    }

    def parse(self, response):
        job_links = response.css(".JB_title a::attr(href)").getall()
        seen = set()

        for job_link in job_links:
            job_url = urljoin(response.url, job_link)
            if job_url in seen:
                continue
            seen.add(job_url)
            yield Request(job_url, callback=self.parse_job_detail, meta={"source_site": "bizcommunity"})

        next_page = response.css("a.jxMore::attr(data-href), a.jxMore::attr(href)").get()
        if next_page:
            yield Request(urljoin(response.url, next_page), callback=self.parse)

    def parse_job_detail(self, response):
        job_posting = self.extract_job_posting(response)

        title = job_posting.get("title") or response.css(".JB_title a::text").get()
        description = self.clean_html_text(job_posting.get("description"))
        company_name = self.extract_company_name(job_posting, response)
        location = self.extract_location(job_posting, response)
        salary_text = self.extract_salary(job_posting)
        employment_type = self.normalize_employment_type(job_posting.get("employmentType"))
        work_mode = self.extract_work_mode(description)
        posted_at = job_posting.get("datePosted")
        source_url = response.url
        external_id = self.extract_external_id(source_url, job_posting)
        apply_url = self.extract_apply_url(response)

        loader = ItemLoader(item=JobItem(), response=response)
        loader.add_value("title", title)
        loader.add_value("description", description)
        loader.add_value("companyName", company_name)
        loader.add_value("location", location)
        loader.add_value("salaryText", salary_text)
        loader.add_value("jobType", employment_type)
        loader.add_value("workMode", work_mode)
        loader.add_value("sourceSite", "bizcommunity")
        loader.add_value("sourceUrl", source_url)
        loader.add_value("externalId", external_id)
        loader.add_value("postedAt", posted_at)
        loader.add_value("applyUrl", apply_url)
        loader.add_value(
            "rawData",
            {
                "title": title,
                "description": description,
                "companyName": company_name,
                "location": location,
                "salaryText": salary_text,
                "jobType": employment_type,
                "workMode": work_mode,
                "sourceSite": "bizcommunity",
                "sourceUrl": source_url,
                "externalId": external_id,
                "postedAt": posted_at,
                "applyUrl": apply_url,
            },
        )

        yield loader.load_item()

    def extract_job_posting(self, response):
        for blob in response.css('script[type="application/ld+json"]::text').getall():
            try:
                payload = json.loads(blob)
            except json.JSONDecodeError:
                continue

            if isinstance(payload, dict) and payload.get("@type") == "JobPosting":
                return payload
            if isinstance(payload, list):
                for item in payload:
                    if isinstance(item, dict) and item.get("@type") == "JobPosting":
                        return item

        return {}

    def extract_company_name(self, job_posting, response):
        hiring_org = job_posting.get("hiringOrganization") or {}
        if isinstance(hiring_org, dict) and hiring_org.get("name"):
            return hiring_org["name"]

        company_text = response.css(".JB_summary p:first-child::text").get()
        return company_text or "Private Employer"

    def extract_location(self, job_posting, response):
        job_location = job_posting.get("jobLocation") or {}
        if isinstance(job_location, dict):
            address = job_location.get("address") or {}
            if isinstance(address, dict):
                locality = address.get("addressLocality")
                region = address.get("addressRegion")
                parts = [part for part in [locality, region] if part]
                if parts:
                    return ", ".join(parts)

        location_text = response.css(".JB_summary p:nth-child(2)::text").get()
        return location_text or "South Africa"

    def extract_salary(self, job_posting):
        base_salary = job_posting.get("baseSalary") or {}
        if not isinstance(base_salary, dict):
            return None

        currency = base_salary.get("currency") or "ZAR"
        value = base_salary.get("value")
        if isinstance(value, dict):
            raw_value = value.get("value")
            unit = value.get("unitText")
            if raw_value and unit:
                return f"{currency} {raw_value} {unit}".strip()
            if raw_value:
                return f"{currency} {raw_value}".strip()

        if isinstance(value, str):
            return f"{currency} {value}".strip()

        return None

    def extract_work_mode(self, description):
        lowered = (description or "").lower()
        if "remote" in lowered or "work from home" in lowered:
            return "Remote"
        if "hybrid" in lowered:
            return "Hybrid"
        return "On-site"

    def normalize_employment_type(self, employment_type):
        if not employment_type:
            return None
        cleaned = str(employment_type).strip().lower()
        mapping = {
            "permanent": "Full-time",
            "full-time": "Full-time",
            "part-time": "Part-time",
            "contract": "Contract",
            "temporary": "Contract",
            "internship": "Internship",
        }
        return mapping.get(cleaned, str(employment_type).strip())

    def extract_apply_url(self, response):
        apply_link = response.css('a[href*="Apply"]::attr(href), a[href*="apply"]::attr(href)').get()
        if apply_link:
            return urljoin(response.url, apply_link)
        return response.url

    def extract_external_id(self, source_url, job_posting):
        identifier = job_posting.get("identifier")
        if isinstance(identifier, dict) and identifier.get("value"):
            return str(identifier["value"])

        match = re.search(r"-([0-9]+[a-z]?)$", source_url.rstrip("/"))
        if match:
            return match.group(1)

        return source_url.rstrip("/").split("/")[-1]

    def clean_html_text(self, value):
        if not value:
            return ""
        text = unescape(unescape(str(value)))
        text = re.sub(r"<[^>]+>", " ", text)
        text = text.replace("\\r", " ").replace("\\n", " ")
        text = re.sub(r"\s+", " ", text).strip()
        return text
