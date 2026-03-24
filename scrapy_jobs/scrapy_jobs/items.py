import scrapy
from scrapy import Field
from itemloaders.processors import MapCompose, TakeFirst
import re


def clean_text(value):
    if value is None:
        return None
    cleaned = re.sub(r"\s+", " ", str(value)).strip()
    return cleaned or None


class JobItem(scrapy.Item):
    title = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    description = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    companyName = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    location = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    salaryText = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    jobType = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    workMode = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    sourceSite = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    sourceUrl = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    externalId = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    postedAt = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    applyUrl = Field(input_processor=MapCompose(clean_text), output_processor=TakeFirst())
    rawData = Field(output_processor=TakeFirst())
