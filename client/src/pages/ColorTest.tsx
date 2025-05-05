import React from 'react';

const ColorTest = () => {
  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="text-2xl font-bold mb-6">Color Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Text Colors</h2>
        <div className="space-y-2">
          <p className="text-primary">This text is primary color (blue)</p>
          <p className="text-accent">This text is accent color (yellow)</p>
          <p className="text-muted">This text is muted color (gray)</p>
          <p className="text-foreground">This text is foreground color (dark)</p>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Link Colors</h2>
        <div className="space-y-2">
          <p><a href="#" className="text-primary hover:text-accent">This link is primary color and turns accent on hover</a></p>
          <p><a href="#" className="text-muted hover:text-primary">This link is muted color and turns primary on hover</a></p>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Footer Links Example</h2>
        <div className="p-4 border border-border rounded-md">
          <h3 className="font-semibold text-lg mb-4">About Us</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-primary hover:text-accent">About Us</a></li>
            <li><a href="#" className="text-primary hover:text-accent">Contact</a></li>
            <li><a href="#" className="text-primary hover:text-accent">Privacy Policy</a></li>
            <li><a href="#" className="text-primary hover:text-accent">Terms of Service</a></li>
            <li><a href="#" className="text-primary hover:text-accent">FAQ</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ColorTest;
