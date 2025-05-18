import CustomHelmet from '@/components/CustomHelmet';
import ComingSoon from '@/components/ComingSoon';

const PostJob = () => {
  return (
    <>
      <CustomHelmet
        title="Post a Job - WorkWise SA"
        description="Post entry-level job opportunities on WorkWise SA."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Post a Job</h1>
          <ComingSoon 
            title="Job Posting Coming Soon" 
            description="Our job posting platform for employers is being prepared for you."
          />
        </div>
      </main>
    </>
  );
};

export default PostJob;
