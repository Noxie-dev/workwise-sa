import React from 'react';
import { WiseUpItem } from '../types';
import ContentDetails from './ContentDetails';
import AdDetails from './AdDetails';

interface LeftPanelProps {
  currentItem: WiseUpItem | null;
}

/**
 * LeftPanel component acts as a container for the left panel in the WiseUp dual-panel layout,
 * conditionally rendering either Content or Ad details based on the currentItem type.
 */
const LeftPanel: React.FC<LeftPanelProps> = ({ currentItem }) => {
  // Determine the appropriate aria-label based on content type
  const getPanelAriaLabel = () => {
    if (!currentItem) return 'Content loading';
    return currentItem.type === 'content' ? 'Content Details' : 'Advertisement Details';
  };

  return (
    <aside
      className="w-full md:w-2/5 border border-gray-200 rounded-lg bg-white p-4 h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      aria-label={getPanelAriaLabel()}
    >
      {!currentItem ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : currentItem.type === 'content' ? (
        <ContentDetails item={currentItem} />
      ) : (
        <AdDetails item={currentItem} />
      )}
    </aside>
  );
};

export default LeftPanel;
