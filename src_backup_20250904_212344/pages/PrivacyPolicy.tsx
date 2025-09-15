import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | WorkWise SA</title>
        <meta name="description" content="Privacy Policy for WorkWise SA - Learn how we collect, use, and protect your personal information." />
      </Helmet>

      <main className="flex-grow bg-light py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
              <CardDescription className="text-center">
                Last updated: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                  <p>
                    WorkWise SA ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our job platform and related services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                  <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Professional information (resume, work experience, skills)</li>
                    <li>Account credentials and authentication data</li>
                    <li>Profile information and preferences</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2 mt-4">2.2 Usage Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Job search and application activities</li>
                    <li>Website usage patterns and interactions</li>
                    <li>Device and browser information</li>
                    <li>IP address and location data</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide and maintain our job platform services</li>
                    <li>Match job seekers with relevant opportunities</li>
                    <li>Process job applications and communications</li>
                    <li>Improve our services and user experience</li>
                    <li>Send relevant job alerts and updates</li>
                    <li>Ensure platform security and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
                  <p className="mb-2">We may share your information with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Employers:</strong> When you apply for jobs, relevant information is shared with potential employers</li>
                    <li><strong>Service Providers:</strong> Third-party services that help us operate our platform</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                    <li><strong>Business Transfers:</strong> In connection with business mergers or acquisitions</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                  <p className="mb-2">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and review your personal information</li>
                    <li>Update or correct inaccurate information</li>
                    <li>Request deletion of your personal data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Export your data in a portable format</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
                  <p>
                    Our platform integrates with third-party services including Facebook for authentication. These services have their own privacy policies, and we encourage you to review them.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
                  <p>
                    We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                  <p>
                    Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. International Transfers</h2>
                  <p>
                    Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Email:</strong> privacy@workwise-sa.com</p>
                    <p><strong>Address:</strong> WorkWise SA, Privacy Team</p>
                    <p><strong>Data Deletion Requests:</strong> <a href="/api/user-data-deletion" className="text-blue-600 hover:underline">Request Data Deletion</a></p>
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

export default PrivacyPolicy;
