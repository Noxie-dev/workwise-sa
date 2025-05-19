import { HelmetProvider } from 'react-helmet-async';
import { Route, Switch, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";
import Resources from "@/pages/Resources";
import WiseUpPage from "@/pages/WiseUp/WiseUpPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CVBuilder from "@/pages/CVBuilder";
import UserProfile from "@/pages/UserProfile";
import ProfileSetup from "@/pages/ProfileSetup";
import EmailLinkLogin from "@/pages/EmailLinkLogin";
import EmailSignInComplete from "@/pages/EmailSignInComplete";
import MarketingRulesPage from "@/pages/MarketingRulesPage";
import AdminDashboard from "@/pages/AdminDashboard";
import Dashboard from "@/pages/Dashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { UITest } from "@/components/ui-test";
import TestPage from "@/pages/TestPage";
import FooterTest from "@/pages/FooterTest";
import ColorTest from "@/pages/ColorTest";
import SimpleTest from "@/pages/SimpleTest";
import HomeSimple from "@/pages/HomeSimple";
import FAQWheelPage from "@/pages/FAQWheelPage";

// Resource pages
import CVTemplates from "@/pages/resources/CVTemplates";
import InterviewTipsPage from "@/pages/resources/InterviewTipsPage";
import SalaryGuide from "@/pages/resources/SalaryGuide";

// Employer pages
import PostJob from "@/pages/employers/PostJob";
import BrowseCandidates from "@/pages/employers/BrowseCandidates";
import Solutions from "@/pages/employers/Solutions";
import Pricing from "@/pages/employers/Pricing";
import SuccessStories from "@/pages/employers/SuccessStories";

// About pages
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import FAQ from "@/pages/FAQ";

function Router() {
  return (
    <>
      <Header />
      <Switch>
        <Route path="/" component={HomeSimple} />
        <Route path="/home-original" component={Home} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/resources" component={Resources} />

        {/* Resource sub-pages */}
        <Route path="/resources/cv-templates" component={CVTemplates} />
        <Route path="/resources/interview-tips" component={InterviewTipsPage} />
        <Route path="/resources/salary-guide" component={SalaryGuide} />

        {/* Employer pages */}
        <Route path="/employers/post-job" component={PostJob} />
        <Route path="/employers/browse-candidates" component={BrowseCandidates} />
        <Route path="/employers/solutions" component={Solutions} />
        <Route path="/employers/pricing" component={Pricing} />
        <Route path="/employers/success-stories" component={SuccessStories} />

        {/* About pages */}
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route path="/faq" component={FAQ} />
        <Route path="/faq-wheel" component={FAQWheelPage} />

        <Route path="/wise-up" component={WiseUpPage} />
        <Route path="/cv-builder" component={CVBuilder} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/profile/:username" component={UserProfile} />
        <Route path="/profile-setup">
          {() => {
            console.log("Rendering ProfileSetup route");
            return <ProfileSetup />;
          }}
        </Route>
        <Route path="/upload-cv">
          {() => {
            console.log("Redirecting to profile setup");
            return <Redirect to="/profile-setup" />;
          }}
        </Route>
        <Route path="/email-link-login" component={EmailLinkLogin} />
        <Route path="/auth/email-signin-complete" component={EmailSignInComplete} />
        <Route path="/ui-test" component={UITest} />
        <Route path="/test" component={TestPage} />
        <Route path="/footer-test" component={FooterTest} />
        <Route path="/color-test" component={ColorTest} />
        <Route path="/simple-test" component={SimpleTest} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/marketing-rules" component={MarketingRulesPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
