import React from 'react';
import { ContentItem } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentDetailsProps {
  item: ContentItem;
}

/**
 * ContentDetails component displays the details for a 'content' type item in the WiseUp feature's left panel.
 * It shows creator information, content title, description, tags, and resource links.
 */
const ContentDetails: React.FC<ContentDetailsProps> = ({ item }) => {
  // Extract first letter of creator's name for avatar fallback
  const creatorInitial = item.creator.name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Creator Info */}
      <div className="flex items-center mb-4">
        <Avatar className="h-12 w-12 mr-3">
          <AvatarImage src={item.creator.avatar} alt={item.creator.name} />
          <AvatarFallback>{creatorInitial}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-base">{item.creator.name}</h2>
          <p className="text-sm text-gray-500">{item.creator.role}</p>
        </div>
      </div>

      {/* Content Title */}
      <h1 className="text-xl font-bold mb-3">{item.title}</h1>

      {/* Description */}
      <p className="text-gray-700 mb-4">{item.description}</p>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Resources */}
      {item.resources && item.resources.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Resources</h3>
          <ul className="space-y-2">
            {item.resources.map((resource, index) => (
              <li key={index} className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Button variant="outline" size="sm" className="flex-1">
          Save
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          Share
        </Button>
      </div>
    </div>
  );
};

export default ContentDetails;
