import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";
import Resources from "@/pages/Resources";
import CVTemplateFooterLink from "@/pages/resources/CVTemplateFooterLink";
import CVTemplatePreview from "@/pages/resources/CVTemplatePreview";
import WiseUpPage from "@/pages/WiseUp/WiseUpPage";
import WiseUpBookmarksPage from "@/pages/WiseUp/WiseUpBookmarksPage";
import BlogWisePage from "@/pages/BlogWisePage";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CVBuilder from "@/pages/CVBuilder";
import UserProfile from "@/pages/UserProfile";
import ProfileSetup from "@/pages/ProfileSetup";
import ProfileSetupRefactored from "@/pages/ProfileSetup_Refactored";
import MarketingRulesPage from "@/pages/MarketingRulesPage";
import EmailLinkLogin from "@/pages/EmailLinkLogin";
import EmailSignInComplete from "@/pages/EmailSignInComplete";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocalStorage } from "@/hooks/use-local-storage";

function Router() {
  // Use localStorage to determine which version of components to use
  const [useRefactoredComponents, setUseRefactoredComponents] = useLocalStorage<boolean>(
    'use-refactored-components',
    true // Default to using refactored components
  );

  // Toggle for development/testing purposes
  const toggleRefactoredComponents = () => {
    setUseRefactoredComponents(!useRefactoredComponents);
  };

  return (
    <>
      <Header />
      {/* Development toggle - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="container mx-auto px-4 py-2 bg-yellow-100 text-center">
          <button
            onClick={toggleRefactoredComponents}
            className="px-3 py-1 bg-primary text-white rounded text-sm"
          >
            {useRefactoredComponents ? 'Switch to Original Components' : 'Switch to Refactored Components'}
          </button>
          <span className="ml-2 text-sm">
            Currently using: <strong>{useRefactoredComponents ? 'Refactored' : 'Original'}</strong> components
          </span>
        </div>
      )}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/resources" component={Resources} />
        <Route path="/resources/cv-template-gallery" component={CVTemplateFooterLink} />
        <Route path="/cv-template-preview/:id" component={CVTemplatePreview} />
        <Route path="/wise-up" component={WiseUpPage} />
        <Route path="/wise-up/bookmarks" component={WiseUpBookmarksPage} />
        <Route path="/blog-wise" component={BlogWisePage} />

        <Route path="/cv-builder" component={CVBuilder} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/profile/:username" component={UserProfile} />
        <Route path="/profile-setup">
          {() => {
            console.log("Rendering ProfileSetup route");
            return useRefactoredComponents ? <ProfileSetupRefactored /> : <ProfileSetup />;
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
        <Route path="/marketing-rules" component={MarketingRulesPage} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
