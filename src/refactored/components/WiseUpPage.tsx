import React, { memo } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

/**
 * WiseUpPage component
 * 
 * A placeholder for the WiseUp page that will be implemented later
 */
const WiseUpPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading WiseUp..." />;
  }
  
  return (
    <>
      <Helmet>
        <title>WiseUp - WorkWise SA</title>
        <meta name="description" content="Learn essential skills for the workplace with WiseUp" />
      </Helmet>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">WiseUp Learning Platform</h1>
        
        {currentUser ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="mb-4">
              Welcome to WiseUp, {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}!
            </p>
            <p>
              This is a placeholder for the WiseUp learning platform. The actual implementation will be added later.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="mb-4">
              Please log in to access the WiseUp learning platform.
            </p>
          </div>
        )}
      </main>
    </>
  );
};

export default memo(WiseUpPage);
