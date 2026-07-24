import fs from 'fs';
import path from 'path';

type SourceRegistryEntry = {
  enabled: boolean;
  approvalStatus: string;
  rolloutStage: string;
  allowIngest: boolean;
  maxConcurrency: number;
  robotsCheckedAt?: string;
  notes?: string;
};

let cachedRegistry: Record<string, SourceRegistryEntry> | null = null;

function registryPath(): string {
  return (
    process.env.SQUAREJUMP_SOURCE_REGISTRY ??
    path.join(process.cwd(), 'scrapy_jobs', 'config', 'source-registry.json')
  );
}

export function loadSourceRegistry(): Record<string, SourceRegistryEntry> {
  if (cachedRegistry) return cachedRegistry;
  const file = registryPath();
  if (!fs.existsSync(file)) {
    throw new Error(`SquareJUMP source registry is missing: ${file}`);
  }
  cachedRegistry = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, SourceRegistryEntry>;
  return cachedRegistry;
}

export function assertSourceMayIngest(sourceId: string): SourceRegistryEntry {
  const source = loadSourceRegistry()[sourceId];
  if (!source) throw new Error(`Source '${sourceId}' is not registered`);
  if (!source.enabled) throw new Error(`Source '${sourceId}' is disabled`);
  if (source.approvalStatus !== 'reviewed') {
    throw new Error(`Source '${sourceId}' has not completed governance review`);
  }
  if (!source.allowIngest || source.rolloutStage === 'blocked') {
    throw new Error(`Source '${sourceId}' is not approved for ingestion`);
  }
  return source;
}

export function resetSourceRegistryCacheForTests() {
  cachedRegistry = null;
}
