import { chromium } from 'playwright';

type WiseUpFeedItem = {
  id: number | string;
  title: string;
  type: 'content' | 'ad';
  media: {
    src: string;
    sourceType: string;
    chapters: Array<{ title: string; startSec: number }>;
    transcript: Array<{ startSec: number; endSec?: number; text: string }>;
  };
};

type PlaybackResult = {
  title: string;
  sourceType: string;
  src: string;
  httpStatus: number | null;
  contentType: string | null;
  readyState: number;
  paused: boolean;
  currentTime: number;
  duration: number | null;
  error: { code: number; message: string } | null;
  playable: boolean;
};

const apiBaseUrl = process.env.WISEUP_API_BASE_URL || 'http://localhost:3001';
const appBaseUrl = process.env.WISEUP_APP_BASE_URL || 'http://localhost:5173';

async function getSampleItems() {
  const response = await fetch(`${apiBaseUrl}/api/v1/wiseup/feed?limit=24&category=qa`);
  if (!response.ok) {
    throw new Error(`WiseUp feed request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { items?: WiseUpFeedItem[] };
  return data.items ?? [];
}

async function getHeadDetails(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      httpStatus: response.status,
      contentType: response.headers.get('content-type'),
    };
  } catch {
    return {
      httpStatus: null,
      contentType: null,
    };
  }
}

async function testPlayback(item: WiseUpFeedItem): Promise<PlaybackResult> {
  const src = new URL(item.media.src, appBaseUrl).toString();
  const head = await getHeadDetails(src);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ locale: 'en-US' });

  try {
    await page.setContent(`
      <video
        src="${src}"
        muted
        playsinline
        preload="metadata"
        style="width: 640px; height: 360px"
      ></video>
    `);

    const state = await page.evaluate(async () => {
      const video = document.querySelector('video');
      if (!video) {
        throw new Error('Video element was not created');
      }

      try {
        await video.play();
      } catch {
        // The media element state below records the concrete browser failure.
      }

      await new Promise(resolve => setTimeout(resolve, 3500));

      return {
        readyState: video.readyState,
        paused: video.paused,
        currentTime: Number(video.currentTime.toFixed(2)),
        duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : null,
        error: video.error
          ? {
              code: video.error.code,
              message: video.error.message,
            }
          : null,
      };
    });

    return {
      title: item.title,
      sourceType: item.media.sourceType,
      src: item.media.src,
      ...head,
      ...state,
      playable: !state.error && state.readyState >= 2 && state.currentTime > 0,
    };
  } finally {
    await browser.close();
  }
}

async function testWiseUpScreen() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, locale: 'en-US' });

  try {
    await page.goto(`${appBaseUrl}/wise-up`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('text=WiseUp Queue', { timeout: 15000 });
    const queueCount = await page.locator('aside button').count();
    const chapterCount = await page.locator('button', { hasText: 'Midpoint probe' }).count();
    const transcriptTabVisible = await page
      .getByRole('button', { name: /Transcript/i })
      .isVisible();
    await page.screenshot({ path: 'screenshots/wiseup-sample-media.png', fullPage: true });

    return {
      queueCount,
      chapterCount,
      transcriptTabVisible,
      screenshot: 'screenshots/wiseup-sample-media.png',
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const items = await getSampleItems();
  if (!items.length) {
    throw new Error(
      'No WiseUp sample media rows were returned. Run pnpm run wiseup:seed-media first.'
    );
  }

  const playbackResults: PlaybackResult[] = [];
  for (const item of items) {
    playbackResults.push(await testPlayback(item));
  }

  const screen = await testWiseUpScreen();
  const failed = playbackResults.filter(result => !result.playable);
  const report = {
    sampleCount: items.length,
    playableCount: playbackResults.length - failed.length,
    failedCount: failed.length,
    screen,
    playbackResults,
  };

  console.log(JSON.stringify(report, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
