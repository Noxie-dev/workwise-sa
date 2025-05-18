import CustomHelmet from '@/components/CustomHelmet';
import HeroSection from '@/components/HeroSection';
import CategoriesSection from '@/components/CategoriesSection';
import JobsSection from '@/components/JobsSection';
import CompaniesSection from '@/components/CompaniesSection';
import CtaSection from '@/components/CtaSection';

const Home = () => {
  return (
    <>
      <CustomHelmet
        title="WorkWise SA - Find Essential Jobs in South Africa"
        description="Find cashier, general worker, security, petrol attendant, domestic worker, cleaner, and landscaping jobs across South Africa."
      />

      <main className="flex-grow">
        <HeroSection />
        <CategoriesSection />
        <JobsSection />
        <CompaniesSection />
        <CtaSection />
      </main>
    </>
  );
};

export default Home;
