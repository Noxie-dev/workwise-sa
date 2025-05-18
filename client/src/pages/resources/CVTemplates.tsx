import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const CVTemplates = () => {
  return (
    <>
      <CustomHelmet
        title="CV Templates - WorkWise SA"
        description="Free CV templates for entry-level job seekers in South Africa."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">CV Templates</h1>
          <ComingSoon 
            title="CV Templates Coming Soon" 
            description="Our collection of professionally designed CV templates is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default CVTemplates;
