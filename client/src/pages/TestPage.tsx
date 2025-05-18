import React from 'react';
import { Button } from '@/components/ui/button';

const TestPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-primary">Test Page</h1>
      <div className="mt-4">
        <Button>Primary Button</Button>
      </div>
    </div>
  );
};

export default TestPage;
