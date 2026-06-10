import CustomHelmet from '@/components/CustomHelmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Briefcase, Mail } from 'lucide-react';
import { Link } from 'wouter';

const SuccessStories = () => {
  return (
    <>
      <CustomHelmet
        title="Success Stories - WorkWise SA"
        description="Employer success stories from using WorkWise SA for recruitment."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Success Stories</h1>
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Employer Case Studies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                We do not have published employer case studies in this runtime yet. When verified stories are available, they will be listed here with measurable hiring outcomes.
              </p>
              <p>
                In the meantime, employers can use the live dashboard, job posting tools, and application tracking surfaces already available on the platform.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/employers/dashboard">
                  <Button className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Open Employer Dashboard
                  </Button>
                </Link>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="mailto:support@workwisesa.co.za">
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default SuccessStories;
