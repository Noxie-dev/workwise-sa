import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const Terms = () => {
  return (
    <>
      <CustomHelmet
        title="Terms of Service - WorkWise SA"
        description="WorkWise SA's terms of service and user agreement."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <ComingSoon 
            title="Terms of Service Coming Soon" 
            description="Our terms of service and user agreement are being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default Terms;
