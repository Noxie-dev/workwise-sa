import CustomHelmet from '@/components/CustomHelmet';
import HeroSection from '@/components/HeroSection';
import CategoriesSection from '@/components/CategoriesSection';
import CompaniesSection from '@/components/CompaniesSection';
import CtaSection from '@/components/CtaSection';

const HomeSimple = () => {
  return (
    <>
      <CustomHelmet
        title="WorkWise SA - Find Essential Jobs in South Africa"
        description="Find cashier, general worker, security, petrol attendant, domestic worker, cleaner, and landscaping jobs across South Africa."
      />

      <main className="flex-grow">
        <HeroSection />
        <CategoriesSection />
        {/* JobsSection removed to avoid potential issues */}
        <CompaniesSection />
        <CtaSection />
      </main>
    </>
  );
};

export default HomeSimple;
