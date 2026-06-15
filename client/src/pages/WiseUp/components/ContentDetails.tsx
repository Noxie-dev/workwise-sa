import React from 'react';
import { ExternalLink, FileText, UserRound } from 'lucide-react';
import { ContentItem } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ContentDetailsProps {
  item: ContentItem;
}

const ContentDetails: React.FC<ContentDetailsProps> = ({ item }) => {
  const creatorInitial = item.creator.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-slate-200">
              <AvatarImage src={item.creator.avatar} alt={item.creator.name} />
              <AvatarFallback className="bg-[#24456f] text-white">{creatorInitial}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.creator.name}</p>
              <p className="text-sm text-slate-500">{item.creator.role}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold leading-tight text-slate-950">{item.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{item.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-[#24456f]">
          <UserRound className="h-4 w-4" />
          {item.category}
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

      {item.resources.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-950">
            <FileText className="h-4 w-4 text-[#24456f]" />
            Resources
          </div>
          <div className="divide-y divide-slate-100">
            {item.resources.map(resource => (
              <a
                key={`${resource.title}-${resource.url}`}
                href={resource.url}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-[#24456f]"
              >
                <span className="font-medium">{resource.title}</span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetails;
