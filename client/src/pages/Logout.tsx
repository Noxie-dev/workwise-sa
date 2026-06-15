import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { CheckCircle2, Loader2 } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOutUser } from '@/lib/firebase';

const Logout = () => {
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    signOutUser()
      .then(() => {
        if (isMounted) {
          setIsComplete(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Log Out | WorkWise SA</title>
        <meta name="description" content="Securely log out of your WorkWise SA account." />
      </Helmet>

      <AuthShell>
        <Card className="w-full shadow-xl shadow-slate-900/10">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              {isComplete ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {hasError
                ? 'Logout needs another try'
                : isComplete
                  ? 'You are signed out'
                  : 'Signing you out'}
            </CardTitle>
            <CardDescription>
              {hasError
                ? 'We could not complete logout. Please try again.'
                : isComplete
                  ? 'Your session has ended securely.'
                  : 'Ending your session securely...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasError ? (
              <Button className="w-full bg-primary" onClick={() => window.location.reload()}>
                Try again
              </Button>
            ) : (
              <Button asChild className="w-full bg-primary" disabled={!isComplete}>
                <Link href="/login">Back to login</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    </>
  );
};

export default Logout;
