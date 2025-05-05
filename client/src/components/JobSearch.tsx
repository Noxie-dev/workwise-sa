import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface JobSearchProps {
  initialQuery?: string;
  className?: string;
}

const JobSearch = ({ initialQuery = '', className = '' }: JobSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [location, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Preserve other query parameters if on jobs page
    if (location.startsWith('/jobs')) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchTerm);
      navigate(`/jobs?${url.searchParams.toString()}`);
    } else {
      navigate(`/jobs?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <Card className={`bg-white shadow-md ${className}`}>
      <CardContent className="p-4">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for: cashier, security, cleaner, nanny..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              type="submit"
              className="bg-primary text-white hover:bg-blue-600"
            >
              Search Jobs
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobSearch;
