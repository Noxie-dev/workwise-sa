import React, { useMemo, useState } from 'react';
import { Bookmark, FileText, Info, MessageCircle, Share2 } from 'lucide-react';
import { WiseUpItem } from '../types';
import AdDetails from './AdDetails';
import CommentSection from './CommentSection';
import ContentDetails from './ContentDetails';

interface LeftPanelProps {
  currentItem: WiseUpItem | null;
  onSeek: (seconds: number) => void;
  onBookmark: () => void;
  onShare: () => void;
  onCtaClick?: (url: string) => void;
}

type PanelTab = 'details' | 'transcript' | 'discussion';

function formatCueTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  currentItem,
  onSeek,
  onBookmark,
  onShare,
  onCtaClick,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('details');
  const transcript = currentItem?.media?.transcript ?? [];
  const tabs = useMemo(
    () => [
      { id: 'details' as const, label: 'Details', icon: Info },
      { id: 'transcript' as const, label: 'Transcript', icon: FileText },
      { id: 'discussion' as const, label: 'Discussion', icon: MessageCircle },
    ],
    []
  );

  if (!currentItem) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading WiseUp details...</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg bg-slate-100 p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-[#24456f] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onBookmark}
          >
            <Bookmark className="h-4 w-4" />
            Save
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'details' &&
          (currentItem.type === 'content' ? (
            <ContentDetails item={currentItem} />
          ) : (
            <AdDetails item={currentItem} onCtaClick={onCtaClick} />
          ))}

        {activeTab === 'transcript' && (
          <div className="space-y-3">
            {transcript.length ? (
              transcript.map(cue => (
                <button
                  key={`${cue.startSec}-${cue.text}`}
                  type="button"
                  className="block w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  onClick={() => onSeek(cue.startSec)}
                >
                  <span className="mb-1 block text-xs font-bold text-[#24456f]">
                    {formatCueTime(cue.startSec)}
                  </span>
                  <span className="text-sm leading-6 text-slate-700">{cue.text}</span>
                </button>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No transcript is available for this item yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'discussion' && <CommentSection item={currentItem} />}
      </div>
    </aside>
  );
};

export default LeftPanel;
