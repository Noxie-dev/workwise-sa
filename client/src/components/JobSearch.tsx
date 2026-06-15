import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';

interface JobSearchProps {
  initialQuery?: string;
  initialLocation?: string;
  className?: string;
}

const JobSearch = ({ initialQuery = '', initialLocation = '', className = '' }: JobSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [locationTerm, setLocationTerm] = useState(initialLocation);
  const [location, navigate] = useLocation();

  useEffect(() => {
    setSearchTerm(initialQuery);
    setLocationTerm(initialLocation);
  }, [initialQuery, initialLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Preserve other query parameters if on jobs page
    if (location.startsWith('/jobs')) {
      const url = new URL(window.location.href);
      if (searchTerm.trim()) {
        url.searchParams.set('q', searchTerm.trim());
      } else {
        url.searchParams.delete('q');
      }
      if (locationTerm.trim()) {
        url.searchParams.set('location', locationTerm.trim());
      } else {
        url.searchParams.delete('location');
      }
      url.searchParams.delete('page');
      navigate(`/jobs?${url.searchParams.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (locationTerm.trim()) params.set('location', locationTerm.trim());
      navigate(`/jobs?${params.toString()}`);
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
                data-testid="job-search-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative sm:w-64">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="City or province"
                className="pl-10 w-full"
                data-testid="job-location-input"
                value={locationTerm}
                onChange={e => setLocationTerm(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="bg-primary text-white hover:bg-blue-600"
              data-testid="job-search-submit"
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
