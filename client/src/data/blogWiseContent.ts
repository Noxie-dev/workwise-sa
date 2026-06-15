export type BlogWisePost = {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  category: string;
  views: number;
  likes: number;
  comments: number;
  backContent?: {
    summary: string;
    tags: string[];
  };
};

export const heroBlogs: BlogWisePost[] = [
  {
    id: 1,
    title: 'Top 10 In-Demand Skills for 2025',
    excerpt:
      "Discover the essential skills that will make you stand out in South Africa's competitive job market.",
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop',
    author: 'Sarah Johnson',
    date: '2024-06-20',
    category: 'Career Tips',
    views: 2100,
    likes: 89,
    comments: 34,
  },
  {
    id: 2,
    title: 'Remote Work Revolution in South Africa',
    excerpt: 'How the remote work trend is reshaping the South African employment landscape.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop',
    author: 'Michael Chen',
    date: '2024-06-18',
    category: 'Work Culture',
    views: 1850,
    likes: 76,
    comments: 28,
  },
  {
    id: 3,
    title: 'Tech Industry Growth Opportunities',
    excerpt:
      'Exploring the booming tech sector and emerging opportunities for South African professionals.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
    author: 'Lisa Williams',
    date: '2024-06-15',
    category: 'Tech Updates',
    views: 3200,
    likes: 142,
    comments: 67,
  },
];

export const popularPosts: BlogWisePost[] = [
  {
    id: 4,
    title: 'CV Writing Secrets',
    excerpt: 'Master the art of creating CVs that get noticed by recruiters.',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop',
    author: 'John Smith',
    date: '2024-06-10',
    category: 'Career Tips',
    views: 4500,
    likes: 203,
    comments: 89,
    backContent: {
      summary:
        'A comprehensive guide covering modern CV writing techniques, ATS optimization, and industry-specific tips.',
      tags: ['CV', 'Career', 'Job Search', 'Tips'],
    },
  },
  {
    id: 5,
    title: 'Interview Preparation Guide',
    excerpt: 'Ace your next interview with these proven strategies and techniques.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    author: 'Emma Davis',
    date: '2024-06-08',
    category: 'Career Tips',
    views: 3800,
    likes: 156,
    comments: 72,
    backContent: {
      summary:
        'From research techniques to body language tips, everything you need to succeed in your next interview.',
      tags: ['Interview', 'Career', 'Preparation', 'Success'],
    },
  },
  {
    id: 6,
    title: 'Salary Negotiation Tips',
    excerpt: 'Learn how to negotiate your worth and secure better compensation packages.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop',
    author: 'David Wilson',
    date: '2024-06-05',
    category: 'Career Tips',
    views: 2900,
    likes: 134,
    comments: 45,
    backContent: {
      summary:
        'Strategic approaches to salary negotiation, market research, and effective communication techniques.',
      tags: ['Salary', 'Negotiation', 'Career', 'Finance'],
    },
  },
];

export const latestPosts: BlogWisePost[] = [
  {
    id: 7,
    title: 'Digital Marketing Careers in Cape Town',
    excerpt:
      'Exploring the growing digital marketing sector and available opportunities in the Mother City.',
    image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=600&h=400&fit=crop',
    author: 'Rachel Green',
    date: '2024-06-12',
    category: 'Industry Insights',
    views: 1200,
    likes: 67,
    comments: 23,
  },
  {
    id: 8,
    title: 'Networking in the Digital Age',
    excerpt: 'How to build meaningful professional connections online and offline.',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop',
    author: 'Tom Anderson',
    date: '2024-06-11',
    category: 'Career Tips',
    views: 980,
    likes: 45,
    comments: 19,
  },
  {
    id: 9,
    title: 'Upskilling for Career Growth',
    excerpt: "The importance of continuous learning and skill development in today's job market.",
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    author: 'Sarah Johnson',
    date: '2024-06-09',
    category: 'Professional Development',
    views: 1500,
    likes: 78,
    comments: 34,
  },
  {
    id: 10,
    title: 'Work-Life Balance Strategies',
    excerpt: 'Practical tips for maintaining a healthy balance between work and personal life.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    author: 'Lisa Williams',
    date: '2024-06-07',
    category: 'Work Culture',
    views: 2100,
    likes: 98,
    comments: 56,
  },
];

export const blogWiseCategories = [
  'All',
  ...Array.from(
    new Set([...heroBlogs, ...popularPosts, ...latestPosts].map(post => post.category))
  ).sort(),
];
