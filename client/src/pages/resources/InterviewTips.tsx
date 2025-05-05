import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const InterviewTips = () => {
  return (
    <>
      <CustomHelmet
        title="Interview Tips - WorkWise SA"
        description="Essential interview tips for entry-level job seekers in South Africa."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Interview Tips</h1>
          <ComingSoon 
            title="Interview Tips Coming Soon" 
            description="Our comprehensive guide to acing your job interviews is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default InterviewTips;
