import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
// Import useState if/when you add form handling logic
// import { useState } from 'react';

const FeedbackTabContent = () => {
  // TODO: Add state and handlers for form submission
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Feedback</CardTitle>
        <CardDescription>
          Help us improve our AI-powered CV builder and other features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Rate AI-Generated Content</h3>
            <p className="text-muted-foreground">How would you rate the quality of our AI-generated content?</p>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="outline"
                  size="sm"
                  className="p-2 h-auto"
                  aria-label={`${star} stars`}
                  // TODO: Add onClick handler for rating
                >
                  <Star className={`h-6 w-6 text-amber-400`} />
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="feature-feedback" className="text-lg font-medium">Feature Feedback</label>
              <p className="text-muted-foreground">Which CV builder feature would you like to comment on?</p>
              <select
                id="feature-feedback"
                className="w-full p-2 border rounded-md"
                // TODO: Add value and onChange handler
              >
                <option value="">Select a feature</option>
                <option value="professional-summary">AI Professional Summary</option>
                <option value="job-description">AI Job Description Enhancement</option>
                <option value="translation">CV Translation</option>
                <option value="templates">CV Templates</option>
                <option value="export">Export Options</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="feedback-text" className="text-lg font-medium">Your Feedback</label>
              <p className="text-muted-foreground">Please share your thoughts, suggestions or report any issues</p>
              <textarea
                id="feedback-text"
                rows={5}
                className="w-full p-2 border rounded-md resize-none"
                placeholder="Type your feedback here..."
                // TODO: Add value and onChange handler
              ></textarea>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-lg font-medium">Email (Optional)</label>
              <p className="text-muted-foreground">If you'd like us to follow up with you</p>
              <input
                type="email"
                id="email"
                className="w-full p-2 border rounded-md"
                placeholder="your@email.com"
                // TODO: Add value and onChange handler
              />
            </div>
            
            <Button
              className="w-full bg-primary"
              // TODO: Add onClick handler for submission
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackTabContent;
