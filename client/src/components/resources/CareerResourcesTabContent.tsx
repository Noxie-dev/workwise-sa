import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  Award
} from 'lucide-react';

const CareerResourcesTabContent = () => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            CV Templates
          </CardTitle>
          <CardDescription>Professional templates to make your CV stand out</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Choose from a variety of industry-specific CV templates designed for entry-level positions in South Africa.</p>
          <Button className="w-full bg-primary">View Templates</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Interview Preparation
          </CardTitle>
          <CardDescription>Tips and strategies for interview success</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Learn how to answer common interview questions for positions like cashier, general worker, security guard, and more.</p>
          <Button className="w-full bg-primary">Read Guide</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            Salary Guide
          </CardTitle>
          <CardDescription>Understand the market rates for your profession</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Access salary information for various entry-level positions across South Africa, including regional differences.</p>
          <Button className="w-full bg-primary">Check Salaries</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
            Career Development
          </CardTitle>
          <CardDescription>Resources for professional growth</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Discover resources for skill development and advancement opportunities for essential workers in South Africa.</p>
          <Button className="w-full bg-primary">Explore Resources</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ThumbsUp className="mr-2 h-5 w-5 text-primary" />
            Job Search Tips
          </CardTitle>
          <CardDescription>Strategies for finding the right opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Learn effective techniques to find and secure positions as a cashier, security guard, domestic worker, or other essential jobs.</p>
          <Button className="w-full bg-primary">View Tips</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5 text-primary" />
            Workplace Skills
          </CardTitle>
          <CardDescription>Develop essential skills for the modern workplace</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Build the professional skills employers value most for entry-level positions in South Africa.</p>
          <Button className="w-full bg-primary">Learn Skills</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CareerResourcesTabContent;
