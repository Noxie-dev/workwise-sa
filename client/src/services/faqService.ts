import apiClient from './apiClient';

/**
 * FAQ item interface
 */
export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  category?: 'job-seekers' | 'employers' | 'general';
}

/**
 * FAQ response interface
 */
export interface FAQResponse {
  success: boolean;
  data: FAQItem[];
  error?: string;
}

// Mock FAQ data for development and fallback
const mockFAQData: FAQItem[] = [
  {
    id: '1',
    question: "How do I create a profile?",
    answer: "Creating your profile is quick and easy! Simply click the 'Sign Up' button, enter your basic details, upload a profile photo (optional), and list your skills and experience. The more complete your profile, the better your chances of finding work!",
    category: 'job-seekers'
  },
  {
    id: '2',
    question: "What jobs are available?",
    answer: "Our platform specializes in connecting South Africans with entry-level and skill-based opportunities including domestic work, gardening, security, retail positions, drivers, artisans, call center agents, hospitality staff, and many more accessible job opportunities.",
    category: 'job-seekers'
  },
  {
    id: '3',
    question: "Do I need qualifications?",
    answer: "Not at all! We focus on connecting people with opportunities based on skills, reliability, and work ethic rather than formal qualifications. Many of our positions require practical skills and a willingness to learn.",
    category: 'job-seekers'
  },
  {
    id: '4',
    question: "Is it free for job seekers?",
    answer: "Yes! Creating a profile, browsing jobs, and applying for positions is completely free for all job seekers. We believe in removing barriers to employment.",
    category: 'job-seekers'
  },
  {
    id: '5',
    question: "How do I know if I'm hired?",
    answer: "You'll receive notifications through our app, SMS, or email (based on your preferences) when an employer shows interest in your profile or invites you for an interview.",
    category: 'job-seekers'
  },
  {
    id: '6',
    question: "How do employers post jobs?",
    answer: "After creating an employer account, simply click 'Post a Job,' fill in the details (position, location, requirements, salary range), and submit. Your job will be visible to suitable candidates within minutes!",
    category: 'employers'
  },
  {
    id: '7',
    question: "What makes Workwise unique?",
    answer: "We focus specifically on accessible employment opportunities that don't require advanced degrees or extensive formal education. Our platform is designed to be usable even with basic phones and limited data, making opportunities accessible to all South Africans.",
    category: 'general'
  },
  {
    id: '8',
    question: "How do you verify workers?",
    answer: "We implement a multi-tier verification system including ID verification, reference checks, and skills assessments for certain positions. Our optional trust score helps employers identify reliable candidates quickly.",
    category: 'employers'
  }
];

/**
 * Service for FAQ-related API calls
 */
export const faqService = {
  /**
   * Get all FAQ items
   */
  async getFAQs(): Promise<FAQItem[]> {
    try {
      // In production, use the real API
      if (!import.meta.env.DEV) {
        const response = await apiClient.get<FAQResponse>('/api/faqs');
        return response.data.data;
      }

      // In development or if API call fails, use empty mock data
      console.log('Using mock FAQ data');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return mockFAQData;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      return mockFAQData;
    }
  },

  /**
   * Get FAQ items by category
   */
  async getFAQsByCategory(category: 'job-seekers' | 'employers' | 'general'): Promise<FAQItem[]> {
    try {
      // In production, use the real API
      if (!import.meta.env.DEV) {
        const response = await apiClient.get<FAQResponse>(`/api/faqs/category/${category}`);
        return response.data.data;
      }

      // In development or if API call fails, filter mock data by category
      console.log(`Using mock FAQ data for category: ${category}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return mockFAQData.filter(item => item.category === category);
    } catch (error) {
      console.error(`Error fetching FAQs for category ${category}:`, error);
      return mockFAQData.filter(item => item.category === category);
    }
  }
};

export default faqService;
