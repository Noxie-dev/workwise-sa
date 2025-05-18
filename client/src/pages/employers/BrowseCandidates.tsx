import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const BrowseCandidates = () => {
  return (
    <>
      <CustomHelmet
        title="Browse Candidates - WorkWise SA"
        description="Find qualified entry-level candidates for your job openings."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Browse Candidates</h1>
          <ComingSoon 
            title="Candidate Database Coming Soon" 
            description="Our candidate database for employers is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default BrowseCandidates;
