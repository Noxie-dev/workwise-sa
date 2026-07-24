import {
  SQUAREJUMP_TAXONOMY_VERSION,
  type CategoryCode,
  type ClassificationResult,
} from '@shared/squarejump-contracts';

type TaxonomyEntry = {
  code: CategoryCode;
  name: string;
  aliases: string[];
};

export const SOUTH_AFRICAN_JOB_TAXONOMY: readonly TaxonomyEntry[] = [
  {
    code: 'SEC',
    name: 'Security',
    aliases: ['security officer', 'security guard', 'cctv', 'psira'],
  },
  {
    code: 'CAS',
    name: 'Cashier and point-of-sale',
    aliases: ['cashier', 'point of sale', 'till operator'],
  },
  {
    code: 'RET',
    name: 'Retail',
    aliases: ['retail', 'shop assistant', 'store assistant', 'merchandiser'],
  },
  {
    code: 'GEN',
    name: 'General worker',
    aliases: ['general worker', 'labourer', 'laborer', 'helper'],
  },
  { code: 'CLN', name: 'Cleaning', aliases: ['cleaner', 'cleaning', 'housekeeping'] },
  {
    code: 'WHR',
    name: 'Warehousing',
    aliases: ['warehouse', 'picker', 'packer', 'forklift', 'inventory'],
  },
  {
    code: 'MFG',
    name: 'Manufacturing and factory',
    aliases: ['manufacturing', 'factory', 'machine operator'],
  },
  {
    code: 'DRV',
    name: 'Driving and transport',
    aliases: ['driver', 'code 10', 'code 14', 'courier'],
  },
  { code: 'LOG', name: 'Logistics', aliases: ['logistics', 'dispatch', 'supply chain', 'fleet'] },
  {
    code: 'PET',
    name: 'Fuel and petrol station',
    aliases: ['petrol attendant', 'fuel attendant', 'forecourt'],
  },
  {
    code: 'CAL',
    name: 'Call centre and customer service',
    aliases: ['call centre', 'contact centre', 'customer service'],
  },
  {
    code: 'CON',
    name: 'Construction',
    aliases: ['construction', 'site worker', 'bricklayer', 'scaffolder'],
  },
  {
    code: 'HSP',
    name: 'Hospitality',
    aliases: ['waiter', 'bartender', 'restaurant', 'hotel', 'kitchen'],
  },
  {
    code: 'DOM',
    name: 'Domestic and care work',
    aliases: ['domestic worker', 'caregiver', 'nanny', 'care worker'],
  },
  {
    code: 'ADM',
    name: 'Administration',
    aliases: ['administrator', 'admin clerk', 'receptionist', 'data capture'],
  },
  {
    code: 'TRD',
    name: 'Trades and artisans',
    aliases: ['artisan', 'electrician', 'plumber', 'welder', 'fitter'],
  },
  {
    code: 'SAL',
    name: 'Sales',
    aliases: ['sales representative', 'sales consultant', 'business development'],
  },
  {
    code: 'LNR',
    name: 'Learnerships and internships',
    aliases: ['learnership', 'internship', 'graduate programme'],
  },
  { code: 'OTH', name: 'Other', aliases: [] },
] as const;

function normalized(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyJob(input: {
  title: string;
  description: string;
  existingCategory?: string | null;
}): ClassificationResult {
  const title = normalized(input.title);
  const haystack = `${title} ${normalized(input.description)}`;
  const scores = SOUTH_AFRICAN_JOB_TAXONOMY.filter(entry => entry.code !== 'OTH')
    .map(entry => {
      let score = 0;
      for (const alias of entry.aliases) {
        const normalizedAlias = normalized(alias);
        if (title === normalizedAlias) score += 100;
        else if (title.includes(normalizedAlias)) score += 55;
        else if (haystack.includes(normalizedAlias)) score += 25;
      }
      if (input.existingCategory && normalized(input.existingCategory) === normalized(entry.name))
        score += 35;
      return { code: entry.code, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return {
      primaryCategoryCode: 'OTH',
      secondaryCategoryCodes: [],
      confidence: 50,
      status: 'broad',
      source: 'fallback',
      taxonomyVersion: SQUAREJUMP_TAXONOMY_VERSION,
    };
  }

  const winner = scores[0];
  const confidence = Math.min(99, winner.score >= 100 ? 98 : winner.score >= 55 ? 92 : 78);
  return {
    primaryCategoryCode: winner.code,
    secondaryCategoryCodes: scores.slice(1, 4).map(entry => entry.code),
    confidence,
    status: confidence >= 90 ? 'accepted' : confidence >= 70 ? 'provisional' : 'broad',
    source: winner.score >= 100 ? 'alias' : 'rules',
    taxonomyVersion: SQUAREJUMP_TAXONOMY_VERSION,
  };
}

export function categoryName(code: CategoryCode): string {
  return SOUTH_AFRICAN_JOB_TAXONOMY.find(entry => entry.code === code)?.name ?? 'Other';
}

const LOCATION_HINTS: Array<{ code: string; province: string; aliases: string[] }> = [
  { code: 'CPT', province: 'WC', aliases: ['cape town', 'bellville', 'stellenbosch', 'somerset west'] },
  { code: 'JHB', province: 'GP', aliases: ['johannesburg', 'sandton', 'soweto', 'roodepoort'] },
  { code: 'PTA', province: 'GP', aliases: ['pretoria', 'centurion', 'midrand'] },
  { code: 'DBN', province: 'KZN', aliases: ['durban', 'umhlanga', 'pinetown'] },
  { code: 'PLK', province: 'LP', aliases: ['polokwane', 'pietersburg'] },
  { code: 'BFN', province: 'FS', aliases: ['bloemfontein'] },
  { code: 'ELS', province: 'EC', aliases: ['east london'] },
  { code: 'PE', province: 'EC', aliases: ['gqeberha', 'port elizabeth'] },
  { code: 'NLP', province: 'MP', aliases: ['nelspruit', 'mbombela'] },
  { code: 'KBY', province: 'NC', aliases: ['kimberley'] },
  { code: 'MAF', province: 'NW', aliases: ['mahikeng', 'mafikeng', 'rustenburg'] },
];

export function normalizeJobLocation(value: string): { locationCode: string | null; provinceCode: string | null } {
  const haystack = normalized(value);
  const match = LOCATION_HINTS.find(entry => entry.aliases.some(alias => haystack.includes(normalized(alias))));
  return match ? { locationCode: match.code, provinceCode: match.province } : { locationCode: null, provinceCode: null };
}
