import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const PrivacyPolicy = () => {
  return (
    <>
      <CustomHelmet
        title="Privacy Policy - WorkWise SA"
        description="WorkWise SA's privacy policy and data protection information."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <ComingSoon 
            title="Privacy Policy Coming Soon" 
            description="Our privacy policy and data protection information is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
