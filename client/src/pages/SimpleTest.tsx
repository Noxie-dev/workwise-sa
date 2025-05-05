import React from 'react';
import Footer from '@/components/Footer';

const SimpleTest = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-white p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
        <p className="mb-4">This page is a simple test page that doesn't rely on any data fetching.</p>
        
        <div className="mb-8 p-4 border border-border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Footer Links Example</h2>
          <ul className="space-y-2">
            <li><a href="#" className="text-primary hover:text-accent">About Us</a></li>
            <li><a href="#" className="text-primary hover:text-accent">Contact</a></li>
            <li><a href="#" className="text-primary hover:text-accent">Privacy Policy</a></li>
            <li><a href="#" className="text-primary hover:text-accent">Terms of Service</a></li>
            <li><a href="#" className="text-primary hover:text-accent">FAQ</a></li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SimpleTest;
