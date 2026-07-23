export const talentSquare = {
  name: 'TalentSquare',
  shortName: 'TalentSquare',
  tagline: 'Find Your Square. Shape Your Future.',
  colours: {
    ink: '#102A47',
    northStar: '#F2C94C',
  },
  products: {
    jobs: { label: 'Square Jobs', href: '/jobs', alias: '/square-jobs' },
    squareUp: { label: 'SquareUp', href: '/square-up', legacyHref: '/wise-up' },
    salaryHub: { label: 'Salary Hub', href: '/salary-hub', legacyHref: '/resources/salary-guide' },
    passport: { label: 'Talent Passport', href: '/talent-passport' },
    tradeSquare: { label: 'TradeSquare', href: '/trade-square' },
  },
  assets: {
    wordmark: null,
    socialImage: null,
  },
} as const;

export type TalentSquareProduct = keyof typeof talentSquare.products;
