// client/src/components/marketing-rules/AdminLayout.tsx
import React from 'react';
import MarketingRulesSidebar from './MarketingRulesSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <MarketingRulesSidebar />
      <div className="flex-1 ml-64 overflow-auto">
        <main className="p-6 max-w-[1200px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
