import React from 'react';
import { BadgeCheck, ExternalLink, Megaphone } from 'lucide-react';
import { AdItem } from '../types';

interface AdDetailsProps {
  item: AdItem;
  onCtaClick?: (url: string) => void;
}

const AdDetails: React.FC<AdDetailsProps> = ({ item, onCtaClick }) => {
  const openCta = (url: string) => {
    onCtaClick?.(url);
    window.location.href = url;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
            <Megaphone className="h-4 w-4" />
            Sponsored
          </div>
          <h2 className="text-2xl font-bold leading-tight text-slate-950">{item.title}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#24456f]">
            <BadgeCheck className="h-4 w-4" />
            {item.advertiser}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {item.notes && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {item.notes}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffc82d] px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f5b800]"
          onClick={() => openCta(item.cta.primary.url)}
        >
          {item.cta.primary.text}
          <ExternalLink className="h-4 w-4" />
        </button>
        {item.cta.secondary && (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            onClick={() => openCta(item.cta.secondary!.url)}
          >
            {item.cta.secondary.text}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdDetails;
