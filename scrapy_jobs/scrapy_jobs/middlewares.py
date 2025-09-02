# Define here the models for your spider middleware
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/spider-middleware.html

import random
import logging
from scrapy import signals
from scrapy.http import HtmlResponse
from scrapy.downloadermiddlewares.useragent import UserAgentMiddleware

logger = logging.getLogger(__name__)


class RotateUserAgentMiddleware(UserAgentMiddleware):
    """Randomly rotate user agents for each request"""
    
    def __init__(self):
        self.user_agent_list = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/14.1.1',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ]
    
    def process_request(self, request, spider):
        ua = random.choice(self.user_agent_list)
        request.headers['User-Agent'] = ua
        return None


class ProxyMiddleware:
    """Middleware for handling proxy rotation (placeholder implementation)"""
    
    def __init__(self):
        # In production, you might want to use a list of proxy servers
        self.proxies = []
        # self.proxies = [
        #     'http://proxy1:port',
        #     'http://proxy2:port',
        # ]
    
    def process_request(self, request, spider):
        # For now, we don't use proxies - but this is where you'd implement proxy rotation
        if self.proxies:
            proxy = random.choice(self.proxies)
            request.meta['proxy'] = proxy
        return None


class ScrapyJobsSpiderMiddleware:
    """Custom spider middleware for scrapy_jobs project"""

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response, spider):
        # Called for each response that goes through the spider
        # middleware and into the spider.
        return None

    def process_spider_output(self, response, result, spider):
        # Called with the results returned from the Spider, after
        # it has processed the response.

        # Must return an iterable of Request, or item objects.
        for i in result:
            yield i

    def process_spider_exception(self, response, exception, spider):
        # Called when a spider or process_spider_input() method
        # (from other spider middleware) raises an exception.
        logger.error(f'Spider exception in {spider.name}: {exception}')

    def process_start_requests(self, start_requests, spider):
        # Called with the start requests of the spider, and works
        # similarly to the process_spider_output() method, except
        # that it doesn't have a response associated.

        # Must return only requests (not items).
        for r in start_requests:
            yield r

    def spider_opened(self, spider):
        spider.logger.info('Spider opened: %s' % spider.name)


class ScrapyJobsDownloaderMiddleware:
    """Custom downloader middleware for scrapy_jobs project"""

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request, spider):
        # Called for each request that goes through the downloader
        # middleware.

        # Must either:
        # - return None: continue processing this request
        # - or return a Response object
        # - or return a Request object
        # - or raise IgnoreRequest: process_exception() methods of
        #   installed downloader middleware will be called
        return None

    def process_response(self, request, response, spider):
        # Called with the response returned from the downloader.

        # Must either;
        # - return a Response object
        # - return a Request object
        # - or raise IgnoreRequest
        return response

    def process_exception(self, request, exception, spider):
        # Called when a download handler or a process_request()
        # (from other downloader middleware) raises an exception.

        # Must either:
        # - return None: continue processing this exception
        # - return a Response object: stops process_exception() chain
        # - return a Request object: stops process_exception() chain
        logger.error(f'Download exception for {request.url}: {exception}')

    def spider_opened(self, spider):
        spider.logger.info('Spider opened: %s' % spider.name)


class RobotsTxtMiddleware:
    """Custom robots.txt handling middleware"""
    
    def process_request(self, request, spider):
        # Add some custom logic for robots.txt handling if needed
        # For now, we rely on Scrapy's built-in RobotsTxtMiddleware
        return None


class RetryMiddleware:
    """Custom retry logic middleware"""
    
    def __init__(self, max_retry_times=3):
        self.max_retry_times = max_retry_times
    
    def process_response(self, request, response, spider):
        if response.status in [500, 502, 503, 504, 408, 429]:
            retry_times = request.meta.get('retry_times', 0) + 1
            
            if retry_times <= self.max_retry_times:
                logger.warning(f'Retrying {request.url} (attempt {retry_times})')
                retryreq = request.copy()
                retryreq.meta['retry_times'] = retry_times
                retryreq.dont_filter = True
                return retryreq
            else:
                logger.error(f'Max retries exceeded for {request.url}')
        
        return response
