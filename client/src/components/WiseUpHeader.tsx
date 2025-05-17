import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

/**
 * Header component for the WorkWise SA WiseUp section
 * Displays the app logo, title, search input, and action buttons
 */
const WiseUpHeader: React.FC = () => {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side: Logo and Title */}
        <div className="flex items-center">
          <img
            src="/images/hero-logo.png"
            alt="WorkWise SA Logo"
            className="h-8 w-8 mr-2"
          />
          <span className="font-bold text-xl text-blue-600">WiseUp</span>
        </div>

        {/* Right side: Search, Notifications, Menu */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search videos..."
              className="pl-9 pr-4 py-2 w-64 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search videos"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>

          {/* Notification Button */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
          </button>

          {/* Menu Button (visible on mobile) */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default WiseUpHeader;
