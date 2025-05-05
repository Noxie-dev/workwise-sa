import React, { useState } from 'react';
import { LoadingScreen } from '../loading-screen';
import { Button } from '../button';

/**
 * Example component demonstrating different LoadingScreen configurations
 */
export const LoadingScreenExample = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingVariant, setLoadingVariant] = useState<'default' | 'custom-message' | 'inline' | 'large'>('default');
  
  const simulateLoading = (variant: 'default' | 'custom-message' | 'inline' | 'large') => {
    setLoadingVariant(variant);
    setIsLoading(true);
    
    // Simulate async operation
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">LoadingScreen Examples</h2>
      
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => simulateLoading('default')}>
          Default Loading Screen
        </Button>
        
        <Button onClick={() => simulateLoading('custom-message')}>
          Custom Message
        </Button>
        
        <Button onClick={() => simulateLoading('inline')}>
          Inline Loading
        </Button>
        
        <Button onClick={() => simulateLoading('large')}>
          Large Spinner
        </Button>
      </div>
      
      {isLoading && (
        <>
          {loadingVariant === 'default' && <LoadingScreen />}
          
          {loadingVariant === 'custom-message' && (
            <LoadingScreen message="Processing your request..." />
          )}
          
          {loadingVariant === 'inline' && (
            <div className="border p-6 rounded-lg">
              <LoadingScreen fullPage={false} message="Loading content..." />
            </div>
          )}
          
          {loadingVariant === 'large' && (
            <LoadingScreen size="lg" backdropBlur="md" message="Loading large content..." />
          )}
        </>
      )}
      
      <div className="mt-8 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Component Content</h3>
        <p>This content remains visible when using the inline loading variant.</p>
      </div>
    </div>
  );
};
