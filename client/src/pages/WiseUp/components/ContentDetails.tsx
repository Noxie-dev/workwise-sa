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
      {/* Creator Info - Larger and more prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-7 rounded-xl shadow-lg mb-8 border-2 border-blue-200">
        <div className="flex items-center mb-6">
          <Avatar className="h-20 w-20 mr-5 ring-4 ring-blue-400 ring-offset-2">
            <AvatarImage src={item.creator.avatar} alt={item.creator.name} />
            <AvatarFallback className="bg-blue-600 text-white text-2xl">{creatorInitial}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-2xl text-blue-800">{item.creator.name}</h2>
            <p className="text-blue-600 text-lg">{item.creator.role}</p>
          </div>
        </div>

        {/* Content Title */}
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{item.title}</h1>

        {/* Description */}
        <p className="text-gray-700 mb-5 text-xl leading-relaxed">{item.description}</p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-2">
            {item.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-base px-4 py-2 rounded-full font-medium shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resources */}
      {item.resources && item.resources.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100 mb-8">
          <h3 className="font-bold text-xl mb-4 text-blue-700">Resources</h3>
          <ul className="space-y-4">
            {item.resources.map((resource, index) => (
              <li key={index} className="flex items-center bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                <ExternalLink className="h-6 w-6 mr-4 text-blue-600" />
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline font-medium text-lg"
                >
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-auto">
        <Button
          size="lg"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-xl rounded-xl shadow-lg"
        >
          Save
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-4 text-xl rounded-xl shadow-lg"
        >
          Share
        </Button>
      </div>
    </div>
  );
};

export default ContentDetails;
