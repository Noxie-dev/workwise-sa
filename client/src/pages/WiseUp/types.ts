/**
 * TypeScript type definitions for the WorkWise SA 'WiseUp' feature
 */

/**
 * Represents a content creator
 */
export interface Creator {
  name: string;
  role: string;
  avatar: string;
}

/**
 * Represents a resource link
 */
export interface Resource {
  title: string;
  url: string;
}

/**
 * Represents a content item in the WiseUp feed
 */
export interface ContentItem {
  id: number | string;
  type: 'content';
  title: string;
  creator: Creator;
  video: string;
  description: string;
  resources: Resource[];
  tags: string[];
}

/**
 * Represents a call-to-action button
 */
export interface CtaButton {
  text: string;
  url: string;
}

/**
 * Represents an advertisement item in the WiseUp feed
 */
export interface AdItem {
  id: number | string;
  type: 'ad';
  advertiser: string;
  title: string;
  video: string;
  cta: {
    primary: CtaButton;
    secondary: CtaButton;
  };
  description: string;
  notes: string;
}

/**
 * Union type representing either a content item or an ad item
 */
export type WiseUpItem = ContentItem | AdItem;
