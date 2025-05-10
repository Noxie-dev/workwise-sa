import CustomHelmet from '@/components/CustomHelmet';
import SalaryCalculator from '@/components/salary/SalaryCalculator';

const SalaryGuide = () => {
  return (
    <>
      <CustomHelmet
        title="Salary Guide & Calculator - WorkWise SA"
        description="Calculate your take-home pay and compare with industry averages across South Africa."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Salary Guide & Calculator</h1>
          <p className="text-muted-foreground mb-8">
            Use our calculator to estimate your take-home pay after tax and compare your salary with industry averages in South Africa.
            All calculations are based on the 2024/2025 tax year.
          </p>
          <SalaryCalculator />
        </div>
      </main>
    </>
  );
};

export default SalaryGuide;
