import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const SalaryGuide = () => {
  return (
    <>
      <CustomHelmet
        title="Salary Guide - WorkWise SA"
        description="Salary expectations for entry-level positions across South Africa."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Salary Guide</h1>
          <ComingSoon 
            title="Salary Guide Coming Soon" 
            description="Our comprehensive salary guide for entry-level positions is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default SalaryGuide;
