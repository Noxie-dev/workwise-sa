import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/AuthShell';

const formSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const nextPath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    return next?.startsWith('/') && !next.startsWith('//') ? next : '/profile-setup';
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(nextPath);
    }
  }, [isAuthenticated, navigate, nextPath]);

  if (isAuthenticated) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate(nextPath);
    } catch (error: any) {
      let errorMessage = 'Failed to sign in with Google. Please try again.';

      // Handle specific Firebase error codes
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage =
          'Google sign-in is not enabled. Please try another method or contact support.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Multiple popup requests were made. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage =
          'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      } else if (error.code === 'firebase/unavailable-config') {
        errorMessage =
          'Firebase login is in demo mode. Add Firebase keys to client/.env or start the emulators.';
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      await signInWithEmail(data.email.trim(), data.password);
      navigate(nextPath);
    } catch (error: any) {
      let errorMessage = 'Invalid email or password. Please try again.';

      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful login attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'firebase/unavailable-config') {
        errorMessage =
          'Firebase login is in demo mode. Add Firebase keys to client/.env or start the emulators.';
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | WorkWise SA</title>
        <meta
          name="description"
          content="Login to your WorkWise SA account to access job applications, saved jobs, and profile settings."
        />
      </Helmet>

      <AuthShell>
        <Card className="w-full shadow-xl shadow-slate-900/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/email-link-login" className="text-sm text-primary hover:underline">
                  Sign in with email link (no password required)
                </Link>
              </div>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted">Or continue with</span>
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
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </AuthShell>
    </>
  );
};

export default Login;
