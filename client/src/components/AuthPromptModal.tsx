import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Eye, Users, Briefcase, Star, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { JobPreview } from '../../../shared/job-types';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: JobPreview;
  onSignUp: () => void;
  onSignIn: () => void;
}

/**
 * Modal that prompts anonymous users to sign up/in to view full job details
 */
const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  job,
  onSignUp,
  onSignIn
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Lock className="w-5 h-5 mr-2 text-primary" />
            Sign Up to Continue
          </DialogTitle>
          <DialogDescription>
            Get full access to job details and start your career journey with WorkWise SA
          </DialogDescription>
        </DialogHeader>

        {job && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{job.title}</h4>
                  <p className="text-xs text-muted truncate">{job.company.name} • {job.location}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{job.shortDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2 text-primary" />
              What you'll get with a free account:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Eye className="w-4 h-4 mr-2 text-green-600" />
                Full job descriptions and requirements
              </li>
              <li className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-green-600" />
                Company details and culture insights
              </li>
              <li className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-green-600" />
                One-click job applications
              </li>
              <li className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-green-600" />
                Personalized job recommendations
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={onSignUp}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={onSignIn}
              className="w-full"
              size="lg"
            >
              Sign In to Existing Account
            </Button>
          </div>

          <p className="text-xs text-center text-muted">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptModal;