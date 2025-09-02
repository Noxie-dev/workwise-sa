import { HelmetProvider } from 'react-helmet-async';
import { Route, Switch, Redirect } from 'wouter';
import { Suspense, lazy } from 'react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/styles/accessibility.css";

// Core pages that should load immediately
import NotFound from "@/pages/not-found";
import HomeSimple from "@/pages/HomeSimple";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import EmailLinkLogin from "@/pages/EmailLinkLogin";
import EmailSignInComplete from "@/pages/EmailSignInComplete";

// Lazy load heavy components
const Home = lazy(() => import("@/pages/Home"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JobDetails = lazy(() => import("@/pages/JobDetails"));
const Companies = lazy(() => import("@/pages/Companies"));
const CompanyProfile = lazy(() => import("@/pages/CompanyProfile"));
const Resources = lazy(() => import("@/pages/Resources"));
const WiseUpPage = lazy(() => import("@/pages/WiseUp/WiseUpPage"));
const CVBuilder = lazy(() => import("@/pages/CVBuilder"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const ProfileSetup = lazy(() => import("@/pages/ProfileSetup"));
const MarketingRulesPage = lazy(() => import("@/pages/MarketingRulesPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminSettings = lazy(() => import("@/pages/admin/SettingsPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const FAQWheelPage = lazy(() => import("@/pages/FAQWheelPage"));

// Lazy load resource pages
const CVTemplates = lazy(() => import("@/pages/resources/CVTemplates"));
const InterviewTipsPage = lazy(() => import("@/pages/resources/InterviewTipsPage"));
const SalaryGuide = lazy(() => import("@/pages/resources/SalaryGuide"));
const CVBuilderHelp = lazy(() => import("@/pages/resources/CVBuilderHelp"));

// Lazy load employer pages
const PostJob = lazy(() => import("@/pages/employers/PostJob"));
const BrowseCandidates = lazy(() => import("@/pages/employers/BrowseCandidates"));
const Solutions = lazy(() => import("@/pages/employers/Solutions"));
const Pricing = lazy(() => import("@/pages/employers/Pricing"));
const SuccessStories = lazy(() => import("@/pages/employers/SuccessStories"));
const EmployerDashboard = lazy(() => import("@/pages/employers/EmployerDashboard"));

// Lazy load legal pages
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));

// Lazy load test pages
const UITest = lazy(() => import("@/components/ui-test").then(module => ({ default: module.UITest })));
const TestPage = lazy(() => import("@/pages/TestPage"));
const FooterTest = lazy(() => import("@/pages/FooterTest"));
const ColorTest = lazy(() => import("@/pages/ColorTest"));
const SimpleTest = lazy(() => import("@/pages/SimpleTest"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function Router() {
  return (
    <>
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={HomeSimple} />
          <Route path="/home-original" component={Home} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/jobs/:id" component={JobDetails} />
          <Route path="/companies" component={Companies} />
          <Route path="/companies/:slug" component={CompanyProfile} />
          <Route path="/resources" component={Resources} />

          {/* Resource sub-pages */}
          <Route path="/resources/cv-templates" component={CVTemplates} />
          <Route path="/resources/interview-tips" component={InterviewTipsPage} />
          <Route path="/resources/salary-guide" component={SalaryGuide} />
          <Route path="/resources/cv-builder-help" component={CVBuilderHelp} />

          {/* Employer pages */}
          <Route path="/employers" component={Solutions} />
          <Route path="/employers/solutions" component={Solutions} />
          <Route path="/employers/pricing" component={Pricing} />
          <Route path="/employers/success-stories" component={SuccessStories} />
          <Route path="/employers/post-job" component={PostJob} />
          <Route path="/employers/browse-candidates" component={BrowseCandidates} />
          <Route path="/employers/dashboard" component={EmployerDashboard} />

          {/* Authentication pages */}
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/email-link-login" component={EmailLinkLogin} />
          <Route path="/auth/email-signin-complete" component={EmailSignInComplete} />

          {/* User pages */}
          <Route path="/profile" component={UserProfile} />
          <Route path="/profile-setup" component={ProfileSetup} />
          <Route path="/dashboard" component={Dashboard} />

          {/* WiseUp pages */}
          <Route path="/wise-up" component={WiseUpPage} />

          {/* CV Builder */}
          <Route path="/cv-builder" component={CVBuilder} />

          {/* FAQ */}
          <Route path="/faq" component={FAQWheelPage} />

          {/* Legal pages */}
          <Route path="/terms" component={Terms} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />

          {/* Admin pages */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/marketing-rules" component={MarketingRulesPage} />
          <Route path="/dashboard" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <Footer />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <EnhancedAuthProvider>
          <AccessibilityProvider>
            <Router />
            <Toaster />
          </AccessibilityProvider>
        </EnhancedAuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;