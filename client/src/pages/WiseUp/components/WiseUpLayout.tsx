import React from 'react';
import { WiseUpItem } from '../types';
import LeftPanel from './LeftPanel';
import MediaPanel from './MediaPanel';

interface WiseUpLayoutProps {
  activeItem: WiseUpItem;
  items: WiseUpItem[];
  onSelectItem: (item: WiseUpItem) => void;
}

/**
 * WiseUpLayout component handles the overall two-panel structure of the WiseUp feature.
 * It consists of a left panel for content details and a right panel for media.
 */
const WiseUpLayout: React.FC<WiseUpLayoutProps> = ({ 
  activeItem, 
  items, 
  onSelectItem 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Media Panel - Right side on desktop, top on mobile */}
      <div className="md:col-span-7 md:order-2">
        <MediaPanel item={activeItem} />
      </div>
      
      {/* Content Panel - Left side on desktop, bottom on mobile */}
      <div className="md:col-span-5 md:order-1">
        <LeftPanel 
          activeItem={activeItem} 
          items={items} 
          onSelectItem={onSelectItem} 
        />
      </div>
    </div>
  );
};

export default WiseUpLayout;
