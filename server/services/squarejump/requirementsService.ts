import type { ClassifiedRequirement } from '@shared/squarejump-contracts';

type Rule = {
  pattern: RegExp;
  type: ClassifiedRequirement['type'];
  code?: (match: RegExpMatchArray) => string;
  label: (match: RegExpMatchArray) => string;
};

const RULES: Rule[] = [
  {
    pattern: /\bpsira(?:\s+grade)?\s+([abcde])\b/i,
    type: 'certification',
    code: match => `PSIRA-${match[1].toUpperCase()}`,
    label: match => `PSIRA Grade ${match[1].toUpperCase()}`,
  },
  {
    pattern: /\bcode\s*(8|10|14|ec1?|c1)\s+(?:driver'?s?\s+)?licen[cs]e\b/i,
    type: 'licence',
    code: match => `ZA-DL-${match[1].toUpperCase()}`,
    label: match => `Code ${match[1].toUpperCase()} driving licence`,
  },
  {
    pattern: /\b(?:grade\s*12|matric(?: certificate)?)\b/i,
    type: 'qualification',
    code: () => 'ZA-NQF-4',
    label: () => 'Grade 12 / Matric',
  },
  {
    pattern: /\b(\d{1,2})\+?\s+years?(?:'| of)?\s+experience\b/i,
    type: 'experience',
    code: match => `YEARS-${match[1]}`,
    label: match => `${match[1]} years of experience`,
  },
];

function necessityAround(text: string, matchIndex: number): ClassifiedRequirement['necessity'] {
  const context = text.slice(Math.max(0, matchIndex - 60), matchIndex + 120).toLowerCase();
  if (/\b(must|required|essential|minimum|compulsory)\b/.test(context)) return 'mandatory';
  if (/\b(preferred|advantage|desirable|beneficial)\b/.test(context)) return 'preferred';
  return 'unknown';
}

export function extractRequirements(text: string): ClassifiedRequirement[] {
  const results: ClassifiedRequirement[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    const code = rule.code?.(match);
    const label = rule.label(match);
    const key = code ?? label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      type: rule.type,
      code,
      label,
      necessity: necessityAround(text, match.index ?? 0),
      confidence: 95,
      source: 'rules',
    });
  }

  return results;
}
