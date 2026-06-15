import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ExternalLink, Megaphone, MonitorPlay, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { AdSlotConfig } from '@shared/monetization';

const fallbackSlot: AdSlotConfig = {
  placement: 'global-top-banner',
  enabled: true,
  maxAds: 1,
  frequency: 1,
  sizes: {
    mobile: { width: 240, height: 160 },
    tablet: { width: 420, height: 280 },
    desktop: { width: 480, height: 320 },
  },
  targeting: {
    mobileOnly: false,
    allowedFormats: ['display', 'video', 'native'],
  },
  fallbackLabel: 'WorkWise Display',
  canSkip: false,
};

function createSessionId() {
  return `top-ad-${Math.random().toString(36).slice(2, 10)}`;
}

function getViewportTier(width: number): keyof AdSlotConfig['sizes'] {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function useViewportTier() {
  const [tier, setTier] = useState<keyof AdSlotConfig['sizes']>(() =>
    typeof window === 'undefined' ? 'desktop' : getViewportTier(window.innerWidth)
  );

  useEffect(() => {
    const updateTier = () => setTier(getViewportTier(window.innerWidth));
    updateTier();
    window.addEventListener('resize', updateTier);
    return () => window.removeEventListener('resize', updateTier);
  }, []);

  return tier;
}

function trackAdEvent(
  eventType: 'impression' | 'click' | 'viewable',
  sessionId: string,
  creativeId: string,
  metadata: Record<string, unknown> = {}
) {
  return fetch('/api/monetization/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      placement: 'global-top-banner',
      eventType,
      creativeId,
      sessionId,
      metadata: {
        source: 'led-display',
        ...metadata,
      },
    }),
    keepalive: true,
  }).catch(() => undefined);
}

function normalizeEmbedUrl(url?: string | null, muted = true) {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&rel=0&playsinline=1&loop=1&playlist=${id}`;
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&rel=0&playsinline=1&loop=1&playlist=${id}`;
    }

    if (host.includes('tiktok.com') && !parsed.pathname.includes('/embed/')) {
      const videoId = parsed.pathname.split('/video/')[1]?.split(/[/?#]/)[0];
      if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
    }

    return url;
  } catch {
    return url;
  }
}

function isNoticeCreative(type?: string) {
  return type === 'notification' || type === 'promotion' || type === 'wiseup-promo';
}

export default function TopAdBanner() {
  const [slot, setSlot] = useState<AdSlotConfig>(fallbackSlot);
  const [muted, setMuted] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const tier = useViewportTier();
  const sessionId = useMemo(createSessionId, []);
  const hasTrackedRef = useRef(false);
  const size = slot.sizes[tier] || fallbackSlot.sizes[tier];
  const creative = slot.creative;
  const creativeType = creative?.creativeType || 'display';
  const creativeId = creative ? String(creative.id) : 'global-top-banner-placeholder';
  const targetUrl = creative?.targetUrl || '/employers/post-job';
  const canSkip = Boolean(slot.canSkip);
  const displayTitle =
    creative?.title ||
    'New on WorkWise SA: jobs, WiseUp videos, hiring updates, and career promotions';
  const displayDescription =
    creative?.description ||
    'This display carries sponsored opportunities, platform announcements, WiseUp launches, and promotions across WorkWise SA.';

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

    fetch('/api/monetization/slots/global-top-banner', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Failed to load top ad slot');
        }
        return response.json();
      })
      .then((payload: AdSlotConfig) => {
        if (active) {
          setSlot({ ...payload, canSkip: Boolean(payload.canSkip) });
          setSkipped(false);
          setMediaReady(false);
        }
      })
      .catch(() => {
        if (active) {
          setSlot(fallbackSlot);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMediaReady(true), 2800);
    return () => window.clearTimeout(timer);
  }, [creativeId]);

  useEffect(() => {
    let frameId = 0;

    const updateCompactMode = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const compactAt = Math.max(680, window.innerHeight * 0.9);
        const expandAt = 140;

        setCompact(current => {
          if (current) {
            return window.scrollY > expandAt;
          }

          return window.scrollY > compactAt;
        });
      });
    };

    updateCompactMode();
    window.addEventListener('scroll', updateCompactMode, { passive: true });
    window.addEventListener('resize', updateCompactMode);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', updateCompactMode);
      window.removeEventListener('resize', updateCompactMode);
    };
  }, []);

  useEffect(() => {
    if (!slot.enabled || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    void trackAdEvent('impression', sessionId, creativeId, { creativeType });
  }, [creativeId, creativeType, sessionId, slot.enabled]);

  if (!slot.enabled || skipped) {
    return null;
  }

  const hasVideo = creativeType === 'video' && Boolean(creative?.videoUrl);
  const hasEmbed = creativeType === 'embed' && Boolean(creative?.embedUrl);
  const hasImage = Boolean(creative?.imageUrl);
  const showHeavyMedia = mediaReady;
  const notice = isNoticeCreative(creativeType);

  return (
    <aside
      className={`sticky top-0 z-40 w-full overflow-hidden border-b border-slate-200 px-3 shadow-[0_12px_32px_rgba(2,6,23,0.14)] transition-[padding] duration-300 ${
        compact ? 'py-1.5' : 'py-3'
      }`}
      aria-label="WorkWise LED display"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage:
          'linear-gradient(45deg, rgba(15, 23, 42, 0.055) 25%, transparent 25%), linear-gradient(-45deg, rgba(15, 23, 42, 0.055) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(15, 23, 42, 0.055) 75%), linear-gradient(-45deg, transparent 75%, rgba(15, 23, 42, 0.055) 75%)',
        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%)]" />
      <div
        className="relative mx-auto w-full"
        style={{
          maxWidth: `${compact ? Math.min(size.width, 360) : Math.min(size.width, 480)}px`,
        }}
        onPointerEnter={() => setMediaReady(true)}
        onFocus={() => setMediaReady(true)}
      >
        <div className="rounded-[14px] border border-black bg-black p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_10px_26px_rgba(0,0,0,0.34)]">
          <div
            className="relative overflow-hidden rounded-[9px] border border-slate-700 bg-slate-950 text-white"
            style={{
              aspectRatio: compact ? '9 / 1.4' : `${size.width} / ${size.height}`,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[length:100%_4px] opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_36%),radial-gradient(circle_at_82%_34%,rgba(250,204,21,0.16),transparent_32%)]" />

            {hasVideo && showHeavyMedia ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={creative?.videoUrl || undefined}
                poster={creative?.imageUrl || undefined}
                muted={muted}
                autoPlay
                loop
                playsInline
                preload="metadata"
              />
            ) : hasEmbed && showHeavyMedia ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={normalizeEmbedUrl(creative?.embedUrl, muted)}
                title={displayTitle}
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : hasImage ? (
              <img
                src={creative?.imageUrl || undefined}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-slate-950" />
            )}

            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
                  {slot.fallbackLabel}
                </span>
              </div>
              <span className="rounded-sm bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                9:6 LED
              </span>
            </div>

            <a
              href={targetUrl}
              target={targetUrl.startsWith('http') ? '_blank' : undefined}
              rel={targetUrl.startsWith('http') ? 'noopener noreferrer sponsored' : 'sponsored'}
              onClick={() => void trackAdEvent('click', sessionId, creativeId, { creativeType })}
              className="absolute inset-0"
              aria-label={`Open ${displayTitle}`}
            />

            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/78 to-transparent px-3 transition-all duration-300 ${
                compact ? 'pb-2 pt-10' : 'pb-3 pt-16'
              }`}
            >
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <div className={`mb-1 items-center gap-2 ${compact ? 'hidden sm:flex' : 'flex'}`}>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-300 text-slate-950 shadow-[0_0_16px_rgba(103,232,249,0.55)]">
                      {notice ? (
                        <Bell className="h-4 w-4" aria-hidden="true" />
                      ) : hasVideo || hasEmbed ? (
                        <MonitorPlay className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Megaphone className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="rounded-sm bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                      {creativeType === 'wiseup-promo'
                        ? 'WiseUp'
                        : creativeType === 'notification'
                          ? 'Notice'
                          : creativeType === 'promotion'
                            ? 'Promo'
                            : 'Ad'}
                    </span>
                  </div>
                  <p
                    className={`font-black leading-tight tracking-normal ${
                      compact ? 'line-clamp-1 text-xs sm:text-sm' : 'line-clamp-2 text-sm sm:text-base'
                    }`}
                  >
                    {displayTitle}
                  </p>
                  <p
                    className={`mt-1 text-xs font-medium leading-snug text-white/78 ${
                      compact ? 'hidden sm:line-clamp-1' : 'line-clamp-2'
                    }`}
                  >
                    {displayDescription}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-950 sm:inline-flex">
                  Open
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="absolute right-2 top-10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMuted(value => !value)}
                className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/68 text-white shadow-sm backdrop-blur transition hover:bg-black/86 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label={muted ? 'Unmute display' : 'Mute display'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              {canSkip ? (
                <button
                  type="button"
                  onClick={() => {
                    setSkipped(true);
                    void trackAdEvent('viewable', sessionId, creativeId, {
                      creativeType,
                      action: 'skip',
                    });
                  }}
                  className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-sm transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Skip display"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              ) : (
                <span className="relative z-10 rounded-full bg-black/70 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/75">
                  Plus skips
                </span>
              )}
            </div>
          </div>
          <div className="mx-auto mt-1 h-1 w-24 rounded-full bg-white/12" />
        </div>
      </div>
    </aside>
  );
}
