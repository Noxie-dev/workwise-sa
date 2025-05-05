import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const Solutions = () => {
  return (
    <>
      <CustomHelmet
        title="Recruitment Solutions - WorkWise SA"
        description="Tailored recruitment solutions for employers in South Africa."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Recruitment Solutions</h1>
          <ComingSoon 
            title="Recruitment Solutions Coming Soon" 
            description="Our tailored recruitment solutions for employers are being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default Solutions;
