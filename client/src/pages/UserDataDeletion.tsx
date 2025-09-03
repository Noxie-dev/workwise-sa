import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const UserDataDeletion = () => {
  const [formData, setFormData] = useState({
    email: '',
    reason: '',
    confirmation: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.confirmation) {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please confirm that you understand the consequences of data deletion.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Request Submitted",
        description: "Your data deletion request has been submitted. We will process it within 30 days as required by law.",
      });
      
      // Reset form
      setFormData({
        email: '',
        reason: '',
        confirmation: false
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Failed to submit your request. Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Helmet>
        <title>User Data Deletion | WorkWise SA</title>
        <meta name="description" content="Request deletion of your personal data from WorkWise SA" />
      </Helmet>

      <main className="flex-grow bg-light py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">User Data Deletion Request</CardTitle>
              <CardDescription className="text-center">
                Request deletion of your personal data from our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Information Section */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-blue-900">Important Information</h3>
                <div className="space-y-3 text-blue-800">
                  <p>
                    <strong>Data Deletion Process:</strong> When you request data deletion, we will:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Remove your personal information from our active databases</li>
                    <li>Delete your account and profile</li>
                    <li>Remove your job applications and saved jobs</li>
                    <li>Process the deletion within 30 days as required by law</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Note:</strong> Some information may be retained for legal compliance purposes, such as transaction records required for tax purposes.
                  </p>
                </div>
              </div>

              {/* Consequences Section */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-yellow-900">Consequences of Data Deletion</h3>
                <div className="space-y-3 text-yellow-800">
                  <p>Please understand that data deletion is <strong>permanent and irreversible</strong>:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You will lose access to your account permanently</li>
                    <li>All your job applications will be removed</li>
                    <li>Your profile and saved jobs will be deleted</li>
                    <li>You will need to create a new account if you want to use our services again</li>
                  </ul>
                </div>
              </div>

              {/* Alternative Options */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-green-900">Alternative Options</h3>
                <div className="space-y-3 text-green-800">
                  <p>Before requesting complete deletion, consider these alternatives:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Account Deactivation:</strong> Temporarily disable your account</li>
                    <li><strong>Profile Privacy:</strong> Make your profile private or hidden</li>
                    <li><strong>Data Export:</strong> Download a copy of your data</li>
                    <li><strong>Contact Support:</strong> Discuss your concerns with our team</li>
                  </ul>
                  <div className="mt-4">
                    <Button variant="outline" className="mr-3">
                      <a href="/profile/manage">Manage Account</a>
                    </Button>
                    <Button variant="outline">
                      <a href="/contact">Contact Support</a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Deletion Request Form */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Submit Deletion Request</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter the email associated with your account"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium mb-2">
                      Reason for Deletion (Optional)
                    </label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Please let us know why you're requesting data deletion..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="confirmation"
                      checked={formData.confirmation}
                      onChange={(e) => handleInputChange('confirmation', e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="confirmation" className="text-sm">
                      I understand that data deletion is permanent and irreversible. I confirm that I want to proceed with deleting all my personal data from WorkWise SA.
                    </label>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.email || !formData.confirmation}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {isSubmitting ? 'Submitting Request...' : 'Submit Deletion Request'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">If you have questions about data deletion or need assistance:</p>
                  <p><strong>Email:</strong> privacy@workwise-sa.com</p>
                  <p><strong>Support:</strong> support@workwise-sa.com</p>
                  <p><strong>Response Time:</strong> We aim to respond to all requests within 48 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default UserDataDeletion;
