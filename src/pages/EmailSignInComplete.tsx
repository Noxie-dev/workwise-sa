import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { checkIfSignInWithEmailLink, completeSignInWithEmailLink, getEmailFromStorage } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const EmailSignInComplete = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const verifyEmailLink = async () => {
      // Check if the URL contains an email sign-in link
      const isEmailLink = checkIfSignInWithEmailLink(window.location.href);
      
      if (!isEmailLink) {
        setIsLoading(false);
        setIsError(true);
        setErrorMessage('Invalid sign-in link. Please request a new link.');
        return;
      }

      // Try to get the email from localStorage
      const emailFromStorage = getEmailFromStorage();
      
      if (emailFromStorage) {
        setEmail(emailFromStorage);
        try {
          await completeSignInWithEmailLink(emailFromStorage, window.location.href);
          toast({
            title: "Login Successful",
            description: "You have been successfully signed in!",
          });
          navigate('/profile-setup');
        } catch (error: any) {
          setIsLoading(false);
          setIsError(true);
          setErrorMessage(error.message || 'Failed to complete sign-in. The link may have expired.');
        }
      } else {
        // If no email in storage, we need to ask the user for their email
        setIsLoading(false);
      }
    };

    verifyEmailLink();
  }, [toast, navigate]);

  const handleCompleteSignIn = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to complete sign-in.",
      });
      return;
    }

    setIsCompleting(true);
    
    try {
      await completeSignInWithEmailLink(email, window.location.href);
      toast({
        title: "Login Successful",
        description: "You have been successfully signed in!",
      });
      navigate('/profile-setup');
    } catch (error: any) {
      setIsError(true);
      setErrorMessage(error.message || 'Failed to complete sign-in. Please try again.');
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Failed to complete sign-in. Please try again.",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <>
      <Helmet>
        <title>Complete Sign-In | WorkWise SA</title>
        <meta name="description" content="Complete your sign-in to WorkWise SA" />
      </Helmet>

      <main className="flex-grow bg-light flex items-center justify-center py-10">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="WorkWise SA Logo" 
                className="h-36 md:h-40 object-contain transition-all duration-200 hover:scale-105"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Complete Sign-In</CardTitle>
            <CardDescription className="text-center">
              {isLoading ? "Verifying your sign-in link..." : 
               isError ? "There was a problem with your sign-in link" : 
               "Please confirm your email to complete sign-in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted">Completing your sign-in...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-4">
                <p className="text-destructive mb-4">{errorMessage}</p>
                <Button 
                  onClick={() => navigate('/email-link-login')}
                  className="bg-primary"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted">
                  Please confirm your email address to complete the sign-in process:
                </p>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isCompleting}
                  />
                </div>
                <Button 
                  className="w-full bg-primary" 
                  onClick={handleCompleteSignIn}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing sign-in...
                    </>
                  ) : "Complete Sign-In"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default EmailSignInComplete; 