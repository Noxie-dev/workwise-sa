// client/src/components/marketing-rules/MarketingRulesSidebar.tsx
import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  FileText,
  HelpCircle,
  LogOut,
} from 'lucide-react';

const MarketingRulesSidebar: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location.includes(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1a2236] text-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-700">
          <h1 className="text-xl font-bold">WorkWise SA</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard"
                className={`flex items-center rounded-md px-3 py-2 text-sm ${
                  isActive('/dashboard') ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/marketing-rules"
                className={`flex items-center rounded-md px-3 py-2 text-sm ${
                  isActive('/marketing-rules') ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Marketing Rules
              </Link>
            </li>
            <li>
              <Link
                to="/analytics"
                className={`flex items-center rounded-md px-3 py-2 text-sm ${
                  isActive('/analytics') ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Analytics
              </Link>
            </li>
            <li>
              <Link
                to="/users"
                className={`flex items-center rounded-md px-3 py-2 text-sm ${
                  isActive('/users') ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Users
              </Link>
            </li>
            <li>
              <Link
                to="/reports"
                className={`flex items-center rounded-md px-3 py-2 text-sm ${
                  isActive('/reports') ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                Reports
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`flex items-center rounded-md px-3 py-2 text-sm ${
                  isActive('/settings') ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <ul className="space-y-1">
            <li>
              <Link
                to="/help"
                className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-gray-700"
              >
                <HelpCircle className="mr-3 h-5 w-5" />
                Help & Support
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-gray-700"
              >
                <Home className="mr-3 h-5 w-5" />
                Back to Site
              </Link>
            </li>
            <li>
              <button
                className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-gray-700"
                onClick={() => console.log('Logout clicked')}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default MarketingRulesSidebar;
