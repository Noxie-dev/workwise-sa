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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertUserSchema } from '@shared/schema';
import { signUpWithEmail, signInWithGoogle } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { createTestUser } from '@/utils/test-user';
// import FacebookLoginButton from '@/components/FacebookLoginButton'; // Commented out for now

const formSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  willingToRelocate: z.boolean().prefault(false),
  agreeTerms: z.literal(true, {
    error: () => 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/profile');
    return null;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      location: '',
      bio: '',
      willingToRelocate: false,
      agreeTerms: false,
    },
  });

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
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted with data:", { ...data, password: "***", confirmPassword: "***" });
    setIsLoading(true);

    try {
      console.log("Validating form data...");
      // Remove confirmPassword and agreeTerms before sending to API
      const { confirmPassword, agreeTerms, ...userData } = data;

      console.log("Attempting to create user with Firebase...");
      console.log("Firebase config available:", !!import.meta.env.VITE_FIREBASE_API_KEY);
      
      // Create user with Firebase
      const user = await signUpWithEmail(userData.email, userData.password, userData.name);
      console.log("User created successfully:", user?.uid);

      // Store additional user data in your database if needed
      // This could be implemented later to save other user details
      console.log("Registration successful, showing toast notification");

      toast({
        title: "Registration Successful",
        description: "Your account has been created. Now let's set up your profile.",
      });

      // Add a small delay to ensure state is updated before redirect
      console.log("Redirecting to profile setup page in 500ms...");
      setTimeout(() => {
        console.log("Executing redirect now");
        // Force redirect to profile setup page
        window.location.href = '/profile-setup';
      }, 500);
    } catch (error: any) {
      let errorMessage = "Failed to create account. Please try again.";
      let actionLink = null;

      console.error("Registration error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
        fullError: error
      });

      // Handle specific Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try logging in instead.";
        actionLink = '/login';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is invalid. Please enter a valid email.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "This sign-up method is not enabled. Please try another method.";
      } else if (error.code === 'auth/internal-error') {
        errorMessage = "An internal error occurred. This could be due to Firebase emulator issues.";
        console.error("Firebase internal error. Check if emulators are running correctly.");
      }

      console.error("Registration error:", error.code, error.message);

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: (
          <div>
            {errorMessage}
            {actionLink && (
              <div className="mt-2">
                <Link href={actionLink} className="text-blue-500 hover:underline">
                  Go to login page
                </Link>
              </div>
            )}
          </div>
        ),
      });
    } finally {
      console.log("Form submission process completed");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register | WorkWise SA</title>
        <meta name="description" content="Create a WorkWise SA account to apply for jobs, save your favorite listings, and get personalized job recommendations." />
      </Helmet>

      <main className="flex-grow bg-light flex items-center justify-center py-10">
        <Card className="w-full max-w-lg mx-4">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img
                src="/images/logo.png"
                alt="WorkWise SA Logo"
                className="h-36 md:h-40 object-contain transition-all duration-200 hover:scale-105"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">
              Sign up to start exploring job opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Cape Town, South Africa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Bio (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Tell us about yourself" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="willingToRelocate"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          I am willing to relocate for work opportunities
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreeTerms"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
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
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
            >
              <i className="fab fa-google mr-2"></i> Google
            </Button>
            {/* <FacebookLoginButton /> */} {/* Commented out for now */}
            <p className="text-center text-sm text-muted mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
            
            {/* Debug button - only visible in development */}
            {import.meta.env.DEV && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Development Tools</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      console.log('Firebase config:', {
                        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
                        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
                        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
                        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
                        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
                        appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
                        useEmulators: import.meta.env.VITE_USE_FIREBASE_EMULATORS
                      });
                      
                      toast({
                        title: "Firebase Config Check",
                        description: `Emulators: ${import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' ? 'Enabled' : 'Disabled'}. Check console for details.`,
                      });
                    }}
                  >
                    Check Firebase Config
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      window.location.href = '/firebase-diagnostics';
                    }}
                  >
                    Firebase Diagnostics
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        const result = await createTestUser();
                        if (result.success) {
                          toast({
                            title: "Test User Created",
                            description: `Email: ${result.credentials.email}, Password: ${result.credentials.password}`,
                          });
                          console.log('Test user credentials:', result.credentials);
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Test User Creation Failed",
                            description: result.error?.message || "Unknown error",
                          });
                        }
                      } catch (error) {
                        console.error('Error creating test user:', error);
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to create test user. See console for details.",
                        });
                      }
                    }}
                  >
                    Create Test User
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
    </>
  );
};

export default Register;
