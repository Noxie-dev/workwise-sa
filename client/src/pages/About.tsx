import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const About = () => {
  return (
    <>
      <CustomHelmet
        title="About Us - WorkWise SA"
        description="Learn about WorkWise SA's mission to connect young South Africans with entry-level jobs."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">About Us</h1>
          <ComingSoon 
            title="About Us Page Coming Soon" 
            description="Our story and mission information is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default About;
