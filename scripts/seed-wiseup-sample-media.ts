import Database from 'better-sqlite3';
import { config as loadEnv } from 'dotenv';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

loadEnv();

const sourceDir = join(process.cwd(), 'public', 'wise-up_test-clips');
const targetDir = join(process.cwd(), 'client', 'public', 'wise-up-test-clips');
const supportedExtensions = new Set(['.mp4', '.mov', '.webm', '.m3u8']);

function getSqliteDatabasePath(connectionString: string) {
  const rawPath = connectionString.replace(/^sqlite:/, '');

  if (!rawPath) {
    return './test.db';
  }

  if (rawPath.startsWith('//')) {
    const withoutSlashes = rawPath.replace(/^\/+/, '');
    return withoutSlashes.startsWith('.') ? withoutSlashes : `/${withoutSlashes}`;
  }

  return rawPath;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'clip'
  );
}

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, match => match.toUpperCase());
}

function sourceTypeFor(extension: string) {
  if (extension === '.m3u8') return 'hls';
  if (extension === '.webm') return 'webm';
  if (extension === '.mov') return 'mov';
  return 'mp4';
}

function getSafeFileName(originalFileName: string, usedNames: Set<string>) {
  const extension = extname(originalFileName).toLowerCase();
  const baseSlug = slugify(basename(originalFileName, extension));
  let candidate = `${baseSlug}${extension}`;
  let index = 2;

  while (usedNames.has(candidate)) {
    candidate = `${baseSlug}-${index}${extension}`;
    index += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function requireWiseUpV1Columns(db: Database.Database) {
  const columns = db.prepare('PRAGMA table_info(wiseup_content)').all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map(column => column.name));
  const requiredColumns = [
    'slug',
    'source_type',
    'poster',
    'thumbnail',
    'duration_sec',
    'aspect_ratio',
    'captions',
    'chapters',
    'transcript',
    'category',
    'active',
    'like_count',
    'comment_count',
    'bookmark_count',
  ];
  const missingColumns = requiredColumns.filter(column => !columnNames.has(column));

  if (missingColumns.length) {
    throw new Error(
      `WiseUp V1 columns are missing: ${missingColumns.join(', ')}. Run pnpm run db:migrate first.`
    );
  }
}

function main() {
  if (!existsSync(sourceDir)) {
    throw new Error(`Sample media folder not found: ${sourceDir}`);
  }

  const connectionString = process.env.DATABASE_URL || 'sqlite:./test.db';
  if (!connectionString.startsWith('sqlite')) {
    throw new Error('This local media seed script currently supports SQLite DATABASE_URL values.');
  }

  mkdirSync(targetDir, { recursive: true });

  const db = new Database(getSqliteDatabasePath(connectionString));
  requireWiseUpV1Columns(db);

  const usedNames = new Set<string>();
  const files = readdirSync(sourceDir)
    .filter(fileName => {
      const sourcePath = join(sourceDir, fileName);
      return (
        statSync(sourcePath).isFile() && supportedExtensions.has(extname(fileName).toLowerCase())
      );
    })
    .sort((left, right) => left.localeCompare(right));

  const selectExisting = db.prepare('SELECT id FROM wiseup_content WHERE slug = ?');
  const updateContent = db.prepare(`
    UPDATE wiseup_content
    SET
      title = @title,
      creator = @creator,
      video = @video,
      source_type = @sourceType,
      poster = @poster,
      thumbnail = @thumbnail,
      duration_sec = @durationSec,
      aspect_ratio = @aspectRatio,
      description = @description,
      resources = @resources,
      tags = @tags,
      captions = @captions,
      chapters = @chapters,
      transcript = @transcript,
      category = @category,
      active = @active,
      like_count = @likeCount,
      comment_count = @commentCount,
      bookmark_count = @bookmarkCount,
      updated_at = CURRENT_TIMESTAMP
    WHERE slug = @slug
  `);
  const insertContent = db.prepare(`
    INSERT INTO wiseup_content (
      slug,
      title,
      creator,
      video,
      source_type,
      poster,
      thumbnail,
      duration_sec,
      aspect_ratio,
      description,
      resources,
      tags,
      captions,
      chapters,
      transcript,
      category,
      active,
      like_count,
      comment_count,
      bookmark_count,
      created_at,
      updated_at
    )
    VALUES (
      @slug,
      @title,
      @creator,
      @video,
      @sourceType,
      @poster,
      @thumbnail,
      @durationSec,
      @aspectRatio,
      @description,
      @resources,
      @tags,
      @captions,
      @chapters,
      @transcript,
      @category,
      @active,
      @likeCount,
      @commentCount,
      @bookmarkCount,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `);

  const seedTransaction = db.transaction(() => {
    let inserted = 0;
    let updated = 0;

    for (const fileName of files) {
      const extension = extname(fileName).toLowerCase();
      const safeFileName = getSafeFileName(fileName, usedNames);
      const sourcePath = join(sourceDir, fileName);
      const targetPath = join(targetDir, safeFileName);
      const sourceType = sourceTypeFor(extension);
      const title = titleize(basename(fileName, extension));
      const slug = `sample-${slugify(basename(safeFileName, extension))}`;
      const videoPath = `/wise-up-test-clips/${safeFileName}`;
      const row = {
        slug,
        title,
        creator: JSON.stringify({
          name: 'WorkWise Sample Media',
          role: 'WiseUp QA Library',
          avatar: '/images/header-logo.png',
        }),
        video: videoPath,
        sourceType,
        poster: '/images/hero-logo.png',
        thumbnail: '/images/hero-logo.png',
        durationSec: 0,
        aspectRatio: '16 / 9',
        description: `QA sample media seeded from public/wise-up_test-clips/${fileName}.`,
        resources: JSON.stringify([
          {
            title: 'Original sample clip',
            url: videoPath,
            type: 'external',
          },
        ]),
        tags: JSON.stringify(['wiseup-sample', 'media-qa', sourceType]),
        captions: JSON.stringify([]),
        chapters: JSON.stringify([
          { title: 'Open', startSec: 0 },
          { title: 'Midpoint probe', startSec: 2 },
          { title: 'End probe', startSec: 4 },
        ]),
        transcript: JSON.stringify([
          {
            startSec: 0,
            endSec: 2,
            text: `Playback begins for ${title}.`,
          },
          {
            startSec: 2,
            endSec: 4,
            text: 'Cue point used to test seeking and progress events.',
          },
        ]),
        category: 'qa',
        active: 1,
        likeCount: 0,
        commentCount: 0,
        bookmarkCount: 0,
      };

      copyFileSync(sourcePath, targetPath);

      const existing = selectExisting.get(slug);
      if (existing) {
        updateContent.run(row);
        updated += 1;
      } else {
        insertContent.run(row);
        inserted += 1;
      }
    }

    return { inserted, updated };
  });

  const result = seedTransaction();
  db.close();

  console.log(
    `Seeded WiseUp sample media: ${files.length} files copied, ${result.inserted} inserted, ${result.updated} updated.`
  );
  console.log(`Served media path: /wise-up-test-clips/<file>`);
}

main();
