import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const SuccessStories = () => {
  return (
    <>
      <CustomHelmet
        title="Success Stories - WorkWise SA"
        description="Employer success stories from using WorkWise SA for recruitment."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Success Stories</h1>
          <ComingSoon 
            title="Success Stories Coming Soon" 
            description="Our collection of employer success stories is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default SuccessStories;
