import { ContentItem, AdItem, WiseUpItem } from '../types';

// Sample content items
export const sampleContentItems: ContentItem[] = [
  {
    id: '1',
    type: 'content',
    title: 'Essential Communication Skills for the Workplace',
    creator: {
      name: 'Career Coach Sarah',
      role: 'Communication Specialist',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Learn the basics of effective communication that will help you succeed in any job.',
    resources: [
      {
        title: 'Communication Skills PDF Guide',
        url: 'https://example.com/communication-guide.pdf'
      },
      {
        title: 'Practice Exercises',
        url: 'https://example.com/exercises'
      }
    ],
    tags: ['Communication', 'Workplace', 'Soft Skills']
  },
  {
    id: '2',
    type: 'content',
    title: 'Microsoft Excel Basics in Under 60 Seconds',
    creator: {
      name: 'Tech Skills Academy',
      role: 'Digital Skills Trainer',
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: 'Quick guide to the most important Excel functions for beginners.',
    resources: [
      {
        title: 'Excel Practice Spreadsheet',
        url: 'https://example.com/excel-practice.xlsx'
      }
    ],
    tags: ['Excel', 'Office Skills', 'Tutorial']
  },
  {
    id: '3',
    type: 'content',
    title: 'How I Got My First Job as a Cashier',
    creator: {
      name: 'David M.',
      role: 'WorkWise Community Member',
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'David shares his journey of finding employment through WorkWise SA.',
    resources: [
      {
        title: 'Cashier Job Listings',
        url: 'https://example.com/cashier-jobs'
      },
      {
        title: 'Interview Tips',
        url: 'https://example.com/interview-tips'
      }
    ],
    tags: ['Success Story', 'Retail Jobs', 'First Job']
  },
  {
    id: '4',
    type: 'content',
    title: 'Top 5 Free Courses for Essential Workers',
    creator: {
      name: 'Education Hub SA',
      role: 'Learning Resources Provider',
      avatar: 'https://i.pravatar.cc/150?img=4'
    },
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'Discover free online courses that can boost your employability in South Africa.',
    resources: [
      {
        title: 'Course Directory',
        url: 'https://example.com/free-courses'
      }
    ],
    tags: ['Education', 'Free Resources', 'Skills Development']
  },
  {
    id: '5',
    type: 'content',
    title: 'Time Management Tips for Busy Workers',
    creator: {
      name: 'Productivity Pro',
      role: 'Workplace Efficiency Coach',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Quick and effective time management strategies for those working multiple jobs.',
    resources: [
      {
        title: 'Time Management Worksheet',
        url: 'https://example.com/time-management'
      },
      {
        title: 'Recommended Apps',
        url: 'https://example.com/productivity-apps'
      }
    ],
    tags: ['Time Management', 'Productivity', 'Work-Life Balance']
  }
];

// Sample ad items
export const sampleAdItems: AdItem[] = [
  {
    id: 'ad1',
    type: 'ad',
    advertiser: 'JobReady Training',
    title: 'Security Guard Certification - 50% Off This Month',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    description: 'Get certified as a security guard with our accredited online course. Special discount for WorkWise SA members.',
    cta: {
      primary: {
        text: 'Enroll Now',
        url: 'https://example.com/security-course'
      },
      secondary: {
        text: 'Learn More',
        url: 'https://example.com/course-details'
      }
    },
    notes: 'Offer valid until the end of the month. Certification recognized nationwide.'
  },
  {
    id: 'ad2',
    type: 'ad',
    advertiser: 'QuickMart Stores',
    title: 'Now Hiring Cashiers and Stock Clerks',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    description: 'Join the QuickMart team! We\'re hiring for multiple positions at our stores across South Africa.',
    cta: {
      primary: {
        text: 'Apply Now',
        url: 'https://example.com/quickmart-jobs'
      },
      secondary: {
        text: 'View Locations',
        url: 'https://example.com/store-locations'
      }
    },
    notes: 'No experience necessary. Training provided. Flexible schedules available.'
  }
];

// Combined sample items
export const sampleItems: WiseUpItem[] = [
  sampleContentItems[0],
  sampleContentItems[1],
  sampleAdItems[0],
  sampleContentItems[2],
  sampleContentItems[3],
  sampleAdItems[1],
  sampleContentItems[4]
];
