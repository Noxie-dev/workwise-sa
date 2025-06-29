import CustomHelmet from '@/components/CustomHelmet';
import FAQWheelPreview from '@/components/FAQWheelPreview';

const FAQ = () => {
  return (
    <>
      <CustomHelmet
        title="FAQ - WorkWise SA"
        description="Frequently asked questions about WorkWise SA."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <FAQWheelPreview />
        </div>
      </main>
    </>
  );
};

export default FAQ;
