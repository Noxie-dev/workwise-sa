import { Router } from 'express';
import {
  resourceCategorySchema,
  resourceDifficultySchema,
  resourceFormatSchema,
  resourceItemSchema,
  resourcesResponseSchema,
  type ResourceCollection,
  type ResourceItem,
} from '../../shared/resources-contracts';

const router = Router();

const resourceCatalog: ResourceItem[] = [
  {
    id: 'cv-template-starter',
    title: 'Entry-level CV templates',
    description:
      'Clean CV layouts for first jobs, retail, admin, security, hospitality, and general worker roles.',
    category: 'cv',
    format: 'template',
    difficulty: 'beginner',
    durationMinutes: 12,
    href: '/resources/cv-templates',
    featured: true,
    popular: true,
    tags: ['cv', 'templates', 'entry level', 'retail', 'admin'],
    outcomes: ['Choose a CV layout', 'Avoid missing sections', 'Start from a proven structure'],
  },
  {
    id: 'cv-builder-help',
    title: 'CV Builder help guide',
    description:
      'Step-by-step help for personal details, education, experience, skills, references, and AI generation.',
    category: 'cv',
    format: 'guide',
    difficulty: 'practical',
    durationMinutes: 18,
    href: '/resources/cv-builder-help',
    featured: true,
    popular: false,
    tags: ['cv builder', 'ai', 'profile', 'help'],
    outcomes: ['Complete each CV section', 'Fix common CV issues', 'Use AI suggestions safely'],
  },
  {
    id: 'interview-prep',
    title: 'Interview preparation playbook',
    description:
      'Practical preparation for common questions, first impressions, phone screens, and follow-up.',
    category: 'interviews',
    format: 'guide',
    difficulty: 'practical',
    durationMinutes: 20,
    href: '/resources/interview-tips',
    featured: true,
    popular: true,
    tags: ['interview', 'questions', 'confidence', 'follow up'],
    outcomes: ['Prepare stronger answers', 'Know what to bring', 'Follow up professionally'],
  },
  {
    id: 'salary-guide',
    title: 'Salary guide and calculator',
    description:
      'Compare weekly, monthly, and hourly pay expectations for entry-level work in South Africa.',
    category: 'salary',
    format: 'tool',
    difficulty: 'quick',
    durationMinutes: 8,
    href: '/resources/salary-guide',
    featured: true,
    popular: true,
    tags: ['salary', 'wages', 'calculator', 'market rates'],
    outcomes: ['Convert pay periods', 'Compare offers', 'Set realistic expectations'],
  },
  {
    id: 'job-search-rhythm',
    title: 'Weekly job-search rhythm',
    description:
      'A repeatable weekly routine for finding roles, tracking applications, and following up.',
    category: 'job-search',
    format: 'checklist',
    difficulty: 'beginner',
    durationMinutes: 10,
    href: '/jobs',
    featured: false,
    popular: true,
    tags: ['job search', 'applications', 'planning', 'follow up'],
    outcomes: ['Plan weekly applications', 'Track next actions', 'Reduce missed follow-ups'],
  },
  {
    id: 'profile-readiness',
    title: 'Profile readiness checklist',
    description:
      'Make your WorkWise profile easier for employers to scan with better contact, skills, and experience details.',
    category: 'job-search',
    format: 'checklist',
    difficulty: 'quick',
    durationMinutes: 7,
    href: '/profile-setup',
    featured: false,
    popular: false,
    tags: ['profile', 'skills', 'visibility'],
    outcomes: ['Improve profile completeness', 'Highlight relevant skills', 'Add missing details'],
  },
  {
    id: 'workplace-basics',
    title: 'Workplace basics for first jobs',
    description:
      'Simple guidance on punctuality, communication, shift expectations, and workplace conduct.',
    category: 'workplace',
    format: 'article',
    difficulty: 'beginner',
    durationMinutes: 9,
    href: '/blog-wise',
    featured: false,
    popular: false,
    tags: ['workplace', 'first job', 'communication', 'shifts'],
    outcomes: ['Understand workplace expectations', 'Communicate clearly', 'Avoid common mistakes'],
  },
  {
    id: 'support-contact',
    title: 'Get support from WorkWise SA',
    description:
      'Find help for account issues, job applications, CV tools, employer workflows, and feedback.',
    category: 'support',
    format: 'guide',
    difficulty: 'quick',
    durationMinutes: 5,
    href: '/contact',
    featured: false,
    popular: false,
    tags: ['support', 'help', 'contact', 'feedback'],
    outcomes: ['Know where to ask for help', 'Report issues clearly', 'Get unstuck faster'],
  },
];

const collections: ResourceCollection[] = [
  {
    id: 'start-here',
    title: 'Start here',
    description: 'The fastest path from blank profile to first good application.',
    resourceIds: ['profile-readiness', 'cv-template-starter', 'job-search-rhythm'],
  },
  {
    id: 'before-interview',
    title: 'Before an interview',
    description: 'Sharpen your profile, answers, and salary expectations before the call.',
    resourceIds: ['interview-prep', 'salary-guide', 'workplace-basics'],
  },
  {
    id: 'fix-my-cv',
    title: 'Fix my CV',
    description: 'Use templates and CV Builder guidance to improve your document.',
    resourceIds: ['cv-template-starter', 'cv-builder-help'],
  },
];

function includesQuery(resource: ResourceItem, query: string) {
  if (!query) return true;

  const haystack = [
    resource.title,
    resource.description,
    resource.category,
    resource.format,
    resource.difficulty,
    ...resource.tags,
    ...resource.outcomes,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

router.get('/', (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = resourceCategorySchema.safeParse(req.query.category).success
      ? String(req.query.category)
      : 'all';
    const format = resourceFormatSchema.safeParse(req.query.format).success
      ? String(req.query.format)
      : 'all';
    const difficulty = resourceDifficultySchema.safeParse(req.query.difficulty).success
      ? String(req.query.difficulty)
      : 'all';

    const resources = resourceCatalog
      .filter(resource => category === 'all' || resource.category === category)
      .filter(resource => format === 'all' || resource.format === format)
      .filter(resource => difficulty === 'all' || resource.difficulty === difficulty)
      .filter(resource => includesQuery(resource, query));

    const response = resourcesResponseSchema.parse({
      resources: resources.map(resource => resourceItemSchema.parse(resource)),
      featured: resourceCatalog.filter(resource => resource.featured).slice(0, 4),
      collections,
      filters: {
        categories: resourceCategorySchema.options,
        formats: resourceFormatSchema.options,
        difficulties: resourceDifficultySchema.options,
      },
      meta: {
        total: resourceCatalog.length,
        returned: resources.length,
        query,
      },
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
