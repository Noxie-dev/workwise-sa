import { HelmetProvider } from 'react-helmet-async';
import { Route, Switch, Redirect } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense, lazy } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OfflineStatus from '@/components/OfflineStatus';
import { LoadingScreen } from '@/components/ui/loading-screen';
import TopAdBanner from '@/components/ads/TopAdBanner';
import ScrollToTopFab from '@/components/ScrollToTopFab';

// Lazy load all pages for better performance
const NotFound = lazy(() => import('@/pages/not-found'));
const Home = lazy(() => import('@/pages/Home'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const Resources = lazy(() => import('@/pages/Resources'));
const WiseUpPage = lazy(() => import('@/pages/WiseUp/WiseUpPage'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Logout = lazy(() => import('@/pages/Logout'));
const CVBuilder = lazy(() => import('@/pages/CVBuilder'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const ProfileSetup = lazy(() => import('@/pages/ProfileSetup'));
const EmailLinkLogin = lazy(() => import('@/pages/EmailLinkLogin'));
const EmailSignInComplete = lazy(() => import('@/pages/EmailSignInComplete'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const MarketingRulesPage = lazy(() => import('@/pages/MarketingRulesPage'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('@/pages/admin/Analytics'));
const AdminSettings = lazy(() => import('@/pages/admin/SettingsPage'));
const AdminAds = lazy(() => import('@/pages/admin/Ads'));
const AdminScraping = lazy(() => import('@/pages/admin/Scraping'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const JobDetails = lazy(() => import('@/pages/JobDetails'));
const HomeSimple = lazy(() => import('@/pages/HomeSimple'));
const FAQWheelPage = lazy(() => import('@/pages/FAQWheelPage'));
const Billing = lazy(() => import('@/pages/Billing'));

// Companies and Blog pages
const Companies = lazy(() => import('@/pages/Companies'));
const BlogWise = lazy(() => import('@/pages/BlogWise'));

// Resource pages
const CVTemplates = lazy(() => import('@/pages/resources/CVTemplates'));
// Use the new InterviewTipsPage component that handles its own lazy loading
const InterviewTips = lazy(() => import('@/pages/resources/InterviewTipsPage'));
const SalaryGuide = lazy(() => import('@/pages/resources/SalaryGuide'));
const CVBuilderHelp = lazy(() => import('@/pages/resources/CVBuilderHelp'));

// Employer pages
const PostJob = lazy(() => import('@/pages/employers/PostJob'));
const EmployerDashboard = lazy(() => import('@/pages/employers/EmployerDashboard'));
const Solutions = lazy(() => import('@/pages/employers/Solutions'));
const Pricing = lazy(() => import('@/pages/employers/Pricing'));
const SuccessStories = lazy(() => import('@/pages/employers/SuccessStories'));

// About pages
const About = lazy(() => import('@/pages/About'));
const AboutUsPage = lazy(() => import('@/pages/AboutUsPage'));
const Contact = lazy(() => import('@/pages/Contact'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Terms = lazy(() => import('@/pages/Terms'));
const FAQ = lazy(() => import('@/pages/FAQ'));

/**
 * Router component with lazy-loaded routes and error boundaries
 */
const Router = () => {
  return (
    <>
      <Header />
      <TopAdBanner />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Switch>
            <Route path="/" component={HomeSimple} />
            <Route path="/home-original" component={Home} />
            <Route path="/jobs" component={Jobs} />
            <Route path="/jobs/:id" component={JobDetails} />
            <Route path="/resources" component={Resources} />

            {/* Resource sub-pages */}
            <Route path="/resources/cv-templates" component={CVTemplates} />
            <Route path="/resources/interview-tips" component={InterviewTips} />
            <Route path="/resources/salary-guide" component={SalaryGuide} />
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
            <Route path="/cv-builder" component={CVBuilder} />
            <Route path="/billing" component={Billing} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/logout" component={Logout} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/profile" component={UserProfile} />
            <Route path="/profile/:username" component={UserProfile} />
            <Route path="/profile-setup">{() => <ProfileSetup />}</Route>
            <Route path="/upload-cv">{() => <Redirect to="/profile-setup" />}</Route>
            <Route path="/email-link-login" component={EmailLinkLogin} />
            <Route path="/auth/email-signin-complete" component={EmailSignInComplete} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route path="/admin/ads" component={AdminAds} />
            <Route path="/admin/scraping" component={AdminScraping} />
            <Route path="/marketing-rules" component={MarketingRulesPage} />
            <Route path="/dashboard" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
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
          <Router />
          <Toaster />
          <OfflineStatus />
          <ScrollToTopFab />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
