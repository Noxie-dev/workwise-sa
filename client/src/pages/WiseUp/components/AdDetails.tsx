import React from 'react';
import { AdItem } from '../types';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface AdDetailsProps {
  item: AdItem;
}

/**
 * AdDetails component displays the details for an 'ad' type item in the WiseUp feature's left panel.
 * It shows advertiser information, ad title, description, and call-to-action buttons.
 */
const AdDetails: React.FC<AdDetailsProps> = ({ item }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Advertiser Info */}
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
          <span className="text-yellow-800 font-bold">AD</span>
        </div>
        <div>
          <h2 className="font-semibold text-base">{item.advertiser}</h2>
          <p className="text-sm text-gray-500">Sponsored</p>
        </div>
      </div>

      {/* Ad Title */}
      <h1 className="text-xl font-bold mb-3">{item.title}</h1>

      {/* Description */}
      <p className="text-gray-700 mb-4">{item.description}</p>

      {/* Notes */}
      {item.notes && (
        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <p className="text-sm text-gray-600">{item.notes}</p>
        </div>
      )}

      {/* Call to Action Buttons */}
      <div className="mt-auto space-y-2">
        <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800">
          {item.cta.primary.text}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" className="w-full">
          {item.cta.secondary.text}
        </Button>
      </div>
    </div>
  );
};

export default AdDetails;
