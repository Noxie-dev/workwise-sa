import CustomHelmet from '@/components/CustomHelmet';
import FAQWheelPreview from '@/components/FAQWheelPreview';

const FAQ = () => {
  return (
    <>
      <CustomHelmet
        title="FAQ - WorkWise SA"
        description="Frequently asked questions about WorkWise SA."
      />

      <main className="flex-grow bg-[#f6faff]">
        <FAQWheelPreview />
      </main>
    </>
  );
};

export default FAQ;
