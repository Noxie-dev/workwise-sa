import { HelmetProvider } from 'react-helmet-async';
import { Route, Switch, Redirect } from 'wouter';
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense, lazy } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { firebaseStatus } from '@/lib/firebase';
import AuthGuard from '@/components/AuthGuard';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import AccessibilityPreferencesController from '@/components/accessibility/AccessibilityPreferencesController';
import SkipLinks from '@/components/accessibility/SkipLinks';

// Lazy load all pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const Resources = lazy(() => import("@/pages/Resources"));
const WiseUpPage = lazy(() => import("@/pages/WiseUp/WiseUpPage"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const CVBuilder = lazy(() => import("@/pages/CVBuilder"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const ProfileSetup = lazy(() => import("@/pages/ProfileSetup"));
const EmailLinkLogin = lazy(() => import("@/pages/EmailLinkLogin"));
const EmailSignInComplete = lazy(() => import("@/pages/EmailSignInComplete"));
const MarketingRulesPage = lazy(() => import("@/pages/MarketingRulesPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSettings = lazy(() => import("@/pages/admin/SettingsPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const JobDetails = lazy(() => import("@/pages/JobDetails"));
const HomeSimple = lazy(() => import("@/pages/HomeSimple"));
const FAQWheelPage = lazy(() => import("@/pages/FAQWheelPage"));
const Billing = lazy(() => import("@/pages/Billing"));

// Companies and Blog pages
const Companies = lazy(() => import("@/pages/Companies"));
const BlogWise = lazy(() => import("@/pages/BlogWise"));

// Resource pages
const CVTemplates = lazy(() => import("@/pages/resources/CVTemplates"));
// Use the new InterviewTipsPage component that handles its own lazy loading
const InterviewTips = lazy(() => import("@/pages/resources/InterviewTipsPage"));
const SalaryGuide = lazy(() => import("@/pages/resources/SalaryGuide"));
const CVBuilderHelp = lazy(() => import("@/pages/resources/CVBuilderHelp"));
const SalaryHub = lazy(() => import("@/pages/SalaryHub"));
const TalentPassport = lazy(() => import("@/pages/TalentPassport"));
const TradeSquare = lazy(() => import("@/pages/TradeSquare"));

// Employer pages
const PostJob = lazy(() => import("@/pages/employers/PostJob"));
const EmployerDashboard = lazy(() => import("@/pages/employers/EmployerDashboard"));
const Solutions = lazy(() => import("@/pages/employers/Solutions"));
const Pricing = lazy(() => import("@/pages/employers/Pricing"));
const SuccessStories = lazy(() => import("@/pages/employers/SuccessStories"));

// About pages
const About = lazy(() => import("@/pages/About"));
const AboutUsPage = lazy(() => import("@/pages/AboutUsPage"));
const Contact = lazy(() => import("@/pages/Contact"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const FAQ = lazy(() => import("@/pages/FAQ"));

/**
 * Router component with lazy-loaded routes and error boundaries
 */
const Router = () => {
  return (
    <>
      <SkipLinks />
      <Header />
      {!firebaseStatus.clientOpsEnabled && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Firebase client features are in demo mode because Firebase keys are missing or placeholder values are being used.
            Add `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_APP_ID` in `client/.env`, or enable emulators with `VITE_USE_FIREBASE_EMULATORS=true`.
          </div>
        </div>
      )}
      <div id="main-content" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Switch>
            <Route path="/" component={HomeSimple} />
            <Route path="/home-original" component={Home} />
            <Route path="/jobs" component={Jobs} />
            <Route path="/jobs/:id" component={JobDetails} />
            <Route path="/square-jobs">
              {() => <Redirect to="/jobs" />}
            </Route>
            <Route path="/resources" component={Resources} />

            {/* Resource sub-pages */}
            <Route path="/resources/cv-templates" component={CVTemplates} />
            <Route path="/resources/interview-tips" component={InterviewTips} />
            <Route path="/resources/salary-guide" component={SalaryGuide} />
            <Route path="/salary-hub" component={SalaryHub} />
            <Route path="/salary-calculator">
              {() => <Redirect to="/salary-hub" />}
            </Route>
            <Route path="/resources/cv-builder-help" component={CVBuilderHelp} />

            {/* Companies and Blog pages */}
            <Route path="/companies" component={Companies} />
            <Route path="/blog-wise" component={BlogWise} />

            {/* Employer pages */}
            <Route path="/employers/dashboard" component={EmployerDashboard} />
            <Route path="/employers/post-job" component={PostJob} />
            <Route path="/employers/jobs/:id/edit" component={PostJob} />
            <Route path="/employers/solutions" component={Solutions} />
            <Route path="/employers/pricing" component={Pricing} />
            <Route path="/employers/success-stories" component={SuccessStories} />

            {/* About pages */}
            <Route path="/about" component={About} />
            <Route path="/about-us" component={AboutUsPage} />
            <Route path="/contact" component={Contact} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms" component={Terms} />
            <Route path="/faq" component={FAQ} />
            <Route path="/faq-wheel" component={FAQWheelPage} />

            <Route path="/wise-up" component={WiseUpPage} />
            <Route path="/square-up" component={WiseUpPage} />
            <Route path="/talent-passport" component={TalentPassport} />
            <Route path="/trade-square" component={TradeSquare} />
            <Route path="/cv-builder">
              {() => (
                <AuthGuard message="Please sign in to build and generate your CV">
                  <CVBuilder />
                </AuthGuard>
              )}
            </Route>
            <Route path="/billing" component={Billing} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/profile" component={UserProfile} />
            <Route path="/profile/:username" component={UserProfile} />
            <Route path="/profile-setup">
              {() => <ProfileSetup />}
            </Route>
            <Route path="/upload-cv">
              {() => <Redirect to="/profile-setup" />}
            </Route>
            <Route path="/email-link-login" component={EmailLinkLogin} />
            <Route path="/auth/email-signin-complete" component={EmailSignInComplete} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route path="/marketing-rules" component={MarketingRulesPage} />
            <Route path="/dashboard" component={Dashboard} />
            <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
    </>
  );
};

/**
 * Main App component
 * Provides global providers (Helmet, QueryClient, Auth) and main layout
 */
const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AccessibilityProvider>
            <Router />
            <AccessibilityPreferencesController />
            <Toaster />
          </AccessibilityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
