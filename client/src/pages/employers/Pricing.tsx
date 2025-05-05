import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const Pricing = () => {
  return (
    <>
      <CustomHelmet
        title="Pricing - WorkWise SA"
        description="Affordable recruitment pricing plans for employers in South Africa."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Pricing</h1>
          <ComingSoon 
            title="Pricing Plans Coming Soon" 
            description="Our affordable pricing plans for employers are being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default Pricing;
