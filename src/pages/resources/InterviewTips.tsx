import CustomHelmet from '@/components/CustomHelmet';
import InterviewTipsContent from '@/components/InterviewTipsContent';

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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <InterviewTipsContent />
          </div>
        </div>
      </main>
    </>
  );
};

export default InterviewTips;
