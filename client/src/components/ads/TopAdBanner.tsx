import { useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import type { AdSlotConfig } from '@shared/monetization';

const fallbackSlot: AdSlotConfig = {
  placement: 'global-top-banner',
  enabled: true,
  maxAds: 1,
  frequency: 1,
  sizes: {
    mobile: { width: 320, height: 100 },
    tablet: { width: 728, height: 90 },
    desktop: { width: 970, height: 90 },
  },
  targeting: {
    mobileOnly: false,
    allowedFormats: ['display'],
  },
  fallbackLabel: 'Sponsored',
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

function trackAdEvent(eventType: 'impression' | 'click', sessionId: string, creativeId: string) {
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
        source: 'global-header',
      },
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export default function TopAdBanner() {
  const [slot, setSlot] = useState<AdSlotConfig>(fallbackSlot);
  const tier = useViewportTier();
  const sessionId = useMemo(createSessionId, []);
  const hasTrackedRef = useRef(false);
  const size = slot.sizes[tier] || fallbackSlot.sizes[tier];
  const creative = slot.creative;
  const creativeId = creative ? String(creative.id) : 'global-top-banner-placeholder';
  const targetUrl = creative?.targetUrl || '/employers/post-job';

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
          setSlot(payload);
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
    if (!slot.enabled || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    void trackAdEvent('impression', sessionId, creativeId);
  }, [creativeId, sessionId, slot.enabled]);

  if (!slot.enabled) {
    return null;
  }

  return (
    <aside className="mx-auto w-full max-w-7xl px-4 pt-4" aria-label="Sponsored banner">
      <div
        className="mx-auto flex w-full flex-col justify-center overflow-hidden rounded-md border border-[#f2c94c]/70 bg-[#fff8df] px-4 py-3 text-[#102a47] shadow-sm sm:flex-row sm:items-center sm:justify-between"
        style={{
          maxWidth: `${size.width}px`,
          minHeight: `${size.height}px`,
          aspectRatio: `${size.width} / ${size.height}`,
        }}
      >
        <div className="flex min-w-0 items-start gap-3">
          {creative?.imageUrl ? (
            <img
              src={creative.imageUrl}
              alt=""
              className="h-14 w-20 shrink-0 rounded-md object-cover sm:h-16 sm:w-28"
              loading="lazy"
            />
          ) : (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f2c94c] text-[#102a47]">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#102a47]">
                {slot.fallbackLabel}
              </span>
              <p className="text-sm font-bold">
                {creative?.title || 'Reach job-ready candidates across South Africa'}
              </p>
            </div>
            <p className="mt-1 text-sm text-[#102a47]/80">
              {creative?.description ||
                'Promote openings, training, or hiring services in this premium site-wide placement.'}
            </p>
          </div>
        </div>
        <a
          href={targetUrl}
          target={targetUrl.startsWith('http') ? '_blank' : undefined}
          rel={targetUrl.startsWith('http') ? 'noopener noreferrer sponsored' : 'sponsored'}
          onClick={() => void trackAdEvent('click', sessionId, creativeId)}
          className="mt-3 inline-flex shrink-0 items-center justify-center rounded-md bg-[#102a47] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#183e67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c94c] focus-visible:ring-offset-2 sm:ml-4 sm:mt-0"
        >
          {creative ? 'Learn more' : 'Advertise here'}
        </a>
      </div>
    </aside>
  );
}
