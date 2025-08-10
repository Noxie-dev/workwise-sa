import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { runFirebaseDiagnostics } from '@/utils/firebase-diagnostics';
import { auth } from '@/lib/firebase';

const FirebaseDiagnostics = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [emulatorsStatus, setEmulatorsStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Check auth status
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthStatus(user ? `Authenticated as ${user.email || user.uid}` : 'Not authenticated');
    });

    // Check emulators
    const checkEmulators = async () => {
      const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
      setEmulatorsStatus(useEmulators ? 'Enabled in configuration' : 'Disabled in configuration');
      
      if (useEmulators) {
        try {
          const response = await fetch('http://localhost:9099', { method: 'GET' });
          if (response.ok) {
            setEmulatorsStatus('Emulators are running');
          } else {
            setEmulatorsStatus('Emulators might not be running correctly');
          }
        } catch (error) {
          setEmulatorsStatus('Cannot connect to emulators - make sure they are running');
        }
      }
    };
    
    checkEmulators();
    
    return () => unsubscribe();
  }, []);

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    try {
      const results = await runFirebaseDiagnostics();
      setTestResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setTestResults({ error: 'Failed to run diagnostics' });
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Firebase Diagnostics | WorkWise SA</title>
      </Helmet>

      <main className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Firebase Diagnostics</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Status</CardTitle>
              <CardDescription>Current status of Firebase services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Authentication Status</h3>
                  <p>{authStatus}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Emulators Status</h3>
                  <p>{emulatorsStatus}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Environment</h3>
                  <p>Mode: {import.meta.env.MODE}</p>
                  <p>Development: {import.meta.env.DEV ? 'Yes' : 'No'}</p>
                </div>
                
                <Button 
                  onClick={runDiagnostics} 
                  disabled={isRunningTests}
                  className="w-full"
                >
                  {isRunningTests ? 'Running Tests...' : 'Run Diagnostics'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Results</CardTitle>
              <CardDescription>Results from Firebase diagnostic tests</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Configuration Status</h3>
                    <p className={testResults.configComplete ? 'text-green-600' : 'text-red-600'}>
                      {testResults.configComplete ? 'Complete' : 'Incomplete'}
                    </p>
                    
                    {!testResults.configComplete && (
                      <div className="mt-2">
                        <h4 className="font-medium">Missing Variables:</h4>
                        <ul className="list-disc pl-5">
                          {testResults.missingVars.map((variable: string) => (
                            <li key={variable}>{variable}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {testResults.error && (
                    <div className="text-red-600">
                      <h3 className="font-medium">Error</h3>
                      <p>{testResults.error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Run diagnostics to see results</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Missing Environment Variables</h3>
                <p>Make sure all required Firebase configuration variables are set in your <code>.env</code> file:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>VITE_FIREBASE_API_KEY</li>
                  <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                  <li>VITE_FIREBASE_PROJECT_ID</li>
                  <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                  <li>VITE_FIREBASE_APP_ID</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">Firebase Emulators</h3>
                <p>If using emulators for development:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Make sure Firebase emulators are running with <code>firebase emulators:start</code></li>
                  <li>Verify that <code>VITE_USE_FIREBASE_EMULATORS=true</code> is set in your <code>.env</code> file</li>
                  <li>Check that the emulator ports match the ones in your code (Auth: 9099, Firestore: 8080, Storage: 9199)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">Authentication Issues</h3>
                <p>If you're having trouble with authentication:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Verify that Email/Password authentication is enabled in your Firebase console</li>
                  <li>Check browser console for specific error messages</li>
                  <li>Try using a different authentication method (like Google Sign-In)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default FirebaseDiagnostics;