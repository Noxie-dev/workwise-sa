import React from 'react';
import FAQWheelPreview from '../components/FAQWheelPreview';

const FAQWheelPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">FAQ Wheel Demo</h1>
      <FAQWheelPreview />
    </div>
  );
};

export default FAQWheelPage;
