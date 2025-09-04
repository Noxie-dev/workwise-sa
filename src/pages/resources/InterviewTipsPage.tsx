import React from 'react';
import InterviewTips from './InterviewTips';

/**
 * InterviewTipsPage component
 *
 * This is a wrapper component for the InterviewTips component.
 * We've removed lazy loading temporarily to fix import issues.
 */
const InterviewTipsPage: React.FC = () => {
  return <InterviewTips />;
};

export default InterviewTipsPage;
