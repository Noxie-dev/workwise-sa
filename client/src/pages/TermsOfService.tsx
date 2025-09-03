import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | WorkWise SA</title>
        <meta name="description" content="Terms of Service for WorkWise SA - Read our terms and conditions for using our job platform." />
      </Helmet>

      <main className="flex-grow bg-light py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
              <CardDescription className="text-center">
                Last updated: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By accessing and using WorkWise SA ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                  <p>
                    WorkWise SA is a job platform that connects job seekers with employers. We provide services including job listings, application processing, profile management, and related employment services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                  <h3 className="text-xl font-medium mb-2">3.1 Account Creation</h3>
                  <p className="mb-2">To use certain features of the Platform, you must create an account. You agree to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2 mt-4">3.2 Account Termination</h3>
                  <p>
                    We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our sole discretion.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
                  <h3 className="text-xl font-medium mb-2">4.1 Job Seekers</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide accurate and truthful information in your profile</li>
                    <li>Maintain the confidentiality of your account</li>
                    <li>Use the Platform for lawful purposes only</li>
                    <li>Respect the privacy and rights of other users</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2 mt-4">4.2 Employers</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide accurate job descriptions and requirements</li>
                    <li>Comply with all applicable employment laws</li>
                    <li>Process applications in a timely manner</li>
                    <li>Maintain confidentiality of applicant information</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
                  <p className="mb-2">You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the Platform for any illegal or unauthorized purpose</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the rights of others</li>
                    <li>Upload malicious code or attempt to hack the Platform</li>
                    <li>Spam or send unsolicited communications</li>
                    <li>Impersonate another person or entity</li>
                    <li>Interfere with the proper functioning of the Platform</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Content and Intellectual Property</h2>
                  <h3 className="text-xl font-medium mb-2">6.1 Your Content</h3>
                  <p>
                    You retain ownership of content you submit to the Platform. By submitting content, you grant us a license to use, display, and distribute it in connection with our services.
                  </p>

                  <h3 className="text-xl font-medium mb-2 mt-4">6.2 Platform Content</h3>
                  <p>
                    The Platform and its original content, features, and functionality are owned by WorkWise SA and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Platform, to understand our practices regarding the collection and use of your personal information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
                  <p>
                    The Platform may integrate with third-party services, including Facebook for authentication. These services have their own terms and privacy policies, and we are not responsible for their practices.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations</h2>
                  <h3 className="text-xl font-medium mb-2">9.1 Service Availability</h3>
                  <p>
                    We strive to maintain the Platform's availability but do not guarantee uninterrupted access. The Platform is provided "as is" without warranties of any kind.
                  </p>

                  <h3 className="text-xl font-medium mb-2 mt-4">9.2 Job Matching</h3>
                  <p>
                    While we use algorithms to match job seekers with opportunities, we do not guarantee job placement or employment outcomes. Job seekers are responsible for their own job search efforts.
                  </p>

                  <h3 className="text-xl font-medium mb-2 mt-4">9.3 Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by law, WorkWise SA shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
                  <p>
                    You agree to indemnify and hold harmless WorkWise SA from any claims, damages, or expenses arising from your use of the Platform or violation of these terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
                  <p>
                    These terms shall be governed by and construed in accordance with the laws of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the courts of South Africa.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify these terms at any time. We will notify users of significant changes by posting the updated terms on the Platform. Your continued use constitutes acceptance of the modified terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                  <p>
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Email:</strong> legal@workwise-sa.com</p>
                    <p><strong>Address:</strong> WorkWise SA, Legal Team</p>
                    <p><strong>Privacy Policy:</strong> <a href="/privacy-policy" className="text-blue-600 hover:underline">View Privacy Policy</a></p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default TermsOfService;