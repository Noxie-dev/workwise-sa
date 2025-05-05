import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const CtaSection = () => {
  return (
    <section className="bg-primary py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Find Essential Jobs Across South Africa</h2>
          <p className="text-blue-100 mb-8 text-lg">Register today to apply for cashier, security, domestic worker, and many other essential positions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-yellow-400 text-gray-800 hover:bg-yellow-500">
              <Link href="/register">
                Create Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="border border-white text-white hover:bg-yellow-400 hover:text-gray-800">
              <Link href="/upload-cv">
                Upload Your CV
              </Link>
            </Button>
          </div>
          <p className="text-blue-100 mt-6 text-sm">
            Already have an account? {' '}
            <Link href="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
