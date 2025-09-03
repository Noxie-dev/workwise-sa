import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Star, 
  Zap, 
  Shield,
  Users,
  CreditCard,
  ArrowRight
} from 'lucide-react';

/**
 * Pricing Page Component
 * Displays WorkWise SA subscription plans and pricing
 */
const Pricing: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleSelectPlan = (plan: string) => {
    setLocation('/payment');
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI-Powered Tools",
      description: "Generate personalized cover letters and optimize your resume with AI"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Unlimited Applications",
      description: "Apply to as many jobs as you want without restrictions"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Priority Support",
      description: "Get help when you need it with our dedicated support team"
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: "Secure Payments",
      description: "Safe and secure payment processing with Stripe"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pricing - WorkWise SA</title>
        <meta name="description" content="Choose the perfect plan for your career journey with WorkWise SA." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-workwise-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Career Success Plan
          </h1>
          <p className="text-xl text-workwise-yellow-light mb-8">
            Unlock your potential with WorkWise SA Premium features
          </p>
          <div className="flex justify-center">
            <Badge className="bg-workwise-yellow text-workwise-blue-dark px-4 py-2 text-lg">
              <Star className="w-5 h-5 mr-2" />
              Most Popular Choice
            </Badge>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-secondary-foreground mb-2">Free</div>
                <div className="text-4xl font-bold text-primary mb-2">R0</div>
                <div className="text-sm text-muted-foreground">Forever</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Basic job search</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">5 job applications/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Basic profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Community support</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/register')}
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-primary shadow-lg scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-secondary-foreground mb-2">Premium</div>
                <div className="text-4xl font-bold text-primary mb-2">R25</div>
                <div className="text-sm text-muted-foreground">per month</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Unlimited job applications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">AI cover letter generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Advanced job filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Resume optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
                onClick={() => handleSelectPlan('premium')}
              >
                Start Premium Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-secondary-foreground mb-2">Enterprise</div>
                <div className="text-4xl font-bold text-primary mb-2">Custom</div>
                <div className="text-sm text-muted-foreground">Contact us</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Everything in Premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Custom integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">24/7 phone support</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/contact')}
              >
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-foreground mb-4">
              Why Choose WorkWise SA?
            </h2>
            <p className="text-lg text-muted-foreground">
              We're committed to helping you succeed in your career journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-secondary-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-secondary-foreground mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of professionals who have found their dream jobs with WorkWise SA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => handleSelectPlan('premium')}
            >
              Start Your Premium Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation('/register')}
            >
              Try Free First
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;