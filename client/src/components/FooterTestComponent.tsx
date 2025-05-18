import React from 'react';
import { Link } from 'wouter';

const FooterTestComponent = () => {
  console.log('FooterTestComponent rendered');
  return (
    <footer className="bg-white border-t border-border pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">About Us</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-primary hover:text-accent">About Us</Link></li>
              <li><Link href="/contact" className="text-primary hover:text-accent">Contact</Link></li>
              <li><Link href="/privacy-policy" className="text-primary hover:text-accent">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-primary hover:text-accent">Terms of Service</Link></li>
              <li><Link href="/faq" className="text-primary hover:text-accent">FAQ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} WorkWise SA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterTestComponent;
