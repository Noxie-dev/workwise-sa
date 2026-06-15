import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
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
import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset } from '@/lib/firebase';
import AuthShell from '@/components/AuthShell';

const formSchema = z.object({
  email: z.email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof formSchema>;

const messageForAuthError = (error: any) => {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-not-found':
      return 'If an account exists for this email, a reset link will be sent.';
    case 'auth/too-many-requests':
      return 'Too many reset attempts. Please wait before trying again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'firebase/unavailable-config':
      return 'Password reset is unavailable until Firebase client keys are configured.';
    default:
      return 'Unable to send a reset link right now. Please try again.';
  }
};

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: FormValues) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSentEmail(email);
      toast({
        title: 'Reset link sent',
        description: 'Check your email for instructions to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: messageForAuthError(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password | WorkWise SA</title>
        <meta name="description" content="Reset your WorkWise SA account password securely." />
      </Helmet>

      <AuthShell>
        <Card className="w-full shadow-xl shadow-slate-900/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email and we will send a secure reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentEmail ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                A reset link has been sent to <strong>{sentEmail}</strong>. You can close this page
                after checking your inbox.
              </div>
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
                    {isLoading ? 'Sending reset link...' : 'Send reset link'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </AuthShell>
    </>
  );
};

export default ForgotPassword;
