import React from 'react';
import FooterTestComponent from '@/components/FooterTestComponent';

const FooterTest = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-2xl font-bold mb-4">Footer Test Page</h1>
        <p>This page is used to test the Footer component.</p>
      </main>
      <FooterTestComponent />
    </div>
  );
};

export default FooterTest;
