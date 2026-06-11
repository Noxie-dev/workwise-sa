import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdPlacement, AdSlotConfig } from '@shared/monetization';

type AdSlotProps = {
  placement: AdPlacement;
  className?: string;
  title?: string;
  description?: string;
};

function createSessionId() {
  return `ad-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AdSlot({
  placement,
  className = '',
  title = 'Sponsored placement',
  description = 'This slot is ready for ad-server integration and event tracking.',
}: AdSlotProps) {
  const [slot, setSlot] = useState<AdSlotConfig | null>(null);
  const sessionId = useMemo(() => createSessionId(), []);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

    fetch(`/api/monetization/slots/${placement}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Failed to load ad slot ${placement}`);
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
          setSlot(null);
        }
      });

    return () => {
      active = false;
    };
  }, [placement]);

  useEffect(() => {
    if (!slot?.enabled || hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;
    void fetch('/api/monetization/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placement,
        eventType: 'impression',
        creativeId: `${placement}-placeholder`,
        sessionId,
        metadata: {
          scaffold: true,
        },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [placement, sessionId, slot]);

  if (slot && !slot.enabled) {
    return null;
  }

  return (
    <aside
      className={`rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm ${className}`}
      aria-label={`${placement} sponsored slot`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
          {slot?.fallbackLabel ?? 'Sponsored'}
        </span>
        <span className="text-xs text-slate-500">{placement}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-xs text-slate-500">
        Ready for provider wiring, impression persistence, and advertiser reporting.
      </p>
    </aside>
  );
}
