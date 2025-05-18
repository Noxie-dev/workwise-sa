import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const Contact = () => {
  return (
    <>
      <CustomHelmet
        title="Contact Us - WorkWise SA"
        description="Get in touch with the WorkWise SA team."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
          <ComingSoon 
            title="Contact Page Coming Soon" 
            description="Our contact information and form are being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default Contact;
