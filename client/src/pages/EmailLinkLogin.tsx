import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendSignInLink, signInWithGoogle } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof formSchema>;

const EmailLinkLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/profile');
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate('/profile-setup');
    } catch (error: any) {
      let errorMessage = "Failed to sign in with Google. Please try again.";

      // Handle specific Firebase error codes
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google sign-in is not enabled. Please try another method or contact support.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Multiple popup requests were made. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Sign-in popup was blocked by your browser. Please allow popups for this site.";
      }

      console.error("Google sign-in error:", error.code, error.message);

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      await sendSignInLink(data.email);
      setEmailSent(true);
      setSentToEmail(data.email);
      toast({
        title: "Email Sent",
        description: "A sign-in link has been sent to your email address.",
      });
    } catch (error: any) {
      let errorMessage = "Failed to send sign-in link. Please try again.";

      // Handle specific Firebase error codes
      if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Email link sign-in is not enabled. Please try another method or contact support.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for email link sign-in. Please try another method.";
      }

      console.error("Email link error:", error.code, error.message);

      toast({
        variant: "destructive",
        title: "Email Link Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Passwordless Login | WorkWise SA</title>
        <meta name="description" content="Login to WorkWise SA with a secure email link - no password required!" />
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
            <CardTitle className="text-2xl font-bold text-center">Passwordless Login</CardTitle>
            <CardDescription className="text-center">
              Get a secure sign-in link sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>
                  We've sent a sign-in link to <strong>{sentToEmail}</strong>.
                  Click the link in the email to sign in to your account.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                    {isLoading ? "Sending link..." : "Send sign-in link"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-light px-2 text-muted">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <i className="fab fa-google mr-2"></i> Google
              </Button>
            </div>
            <p className="text-center text-sm text-muted mt-4">
              Want to use a password instead?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Password login
              </Link>
            </p>
            <p className="text-center text-sm text-muted">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
};

export default EmailLinkLogin;