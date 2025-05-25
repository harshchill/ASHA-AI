import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  type: string; // full-time, part-time, etc.
  postedDate: string;
}

interface ScrapedResource {
  title: string;
  content: string;
  url: string;
  category: string;
}

class HerKeyScraper {
  private baseUrl = 'https://herkey.com';
  private jobsCache: ScrapedJob[] = [];
  private resourcesCache: ScrapedResource[] = [];
  private lastScrapedTime: Date | null = null;

  private async scrapeJobs(): Promise<ScrapedJob[]> {
    try {
      // Scrape job listings from HerKey
      const response = await axios.get(`${this.baseUrl}/jobs-for-women`);
      const $ = cheerio.load(response.data);
      const jobs: ScrapedJob[] = [];

      // Adjust these selectors based on HerKey's actual HTML structure
      $('.job-card').each((_, element) => {
        const job: ScrapedJob = {
          title: $(element).find('.job-title').text().trim(),
          company: $(element).find('.company-name').text().trim(),
          location: $(element).find('.location').text().trim(),
          description: $(element).find('.description').text().trim(),
          url: this.baseUrl + $(element).find('a').attr('href'),
          type: $(element).find('.job-type').text().trim(),
          postedDate: $(element).find('.posted-date').text().trim(),
        };
        jobs.push(job);
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping jobs:', error);
      return [];
    }
  }

  private async scrapeResources(): Promise<ScrapedResource[]> {
    try {
      // Scrape resources, articles, and guides from HerKey
      const response = await axios.get(`${this.baseUrl}/resources`);
      const $ = cheerio.load(response.data);
      const resources: ScrapedResource[] = [];

      // Adjust these selectors based on HerKey's actual HTML structure
      $('.resource-card').each((_, element) => {
        const resource: ScrapedResource = {
          title: $(element).find('.resource-title').text().trim(),
          content: $(element).find('.resource-content').text().trim(),
          url: this.baseUrl + $(element).find('a').attr('href'),
          category: $(element).find('.category').text().trim(),
        };
        resources.push(resource);
      });

      return resources;
    } catch (error) {
      console.error('Error scraping resources:', error);
      return [];
    }
  }

  public async refreshData(): Promise<void> {
    // Refresh data every 6 hours
    if (this.lastScrapedTime && (new Date().getTime() - this.lastScrapedTime.getTime()) < 6 * 60 * 60 * 1000) {
      return;
    }

    const [jobs, resources] = await Promise.all([
      this.scrapeJobs(),
      this.scrapeResources()
    ]);

    this.jobsCache = jobs;
    this.resourcesCache = resources;
    this.lastScrapedTime = new Date();
  }

  public getJobs(): ScrapedJob[] {
    return this.jobsCache;
  }

  public getResources(): ScrapedResource[] {
    return this.resourcesCache;
  }

  public searchJobs(query: string): ScrapedJob[] {
    const searchTerms = query.toLowerCase().split(' ');
    return this.jobsCache.filter(job => {
      const jobText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      return searchTerms.every(term => jobText.includes(term));
    });
  }

  public searchResources(query: string): ScrapedResource[] {
    const searchTerms = query.toLowerCase().split(' ');
    return this.resourcesCache.filter(resource => {
      const resourceText = `${resource.title} ${resource.content}`.toLowerCase();
      return searchTerms.every(term => resourceText.includes(term));
    });
  }
}

export const herkeyScraper = new HerKeyScraper();
