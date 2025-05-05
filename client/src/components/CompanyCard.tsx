import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { type Company } from '@shared/schema';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <Link href={`/companies/${company.slug}`}>
      <Card className="w-40 flex flex-col items-center text-center cursor-pointer">
        <CardContent className="p-0 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-light p-1 border border-border mb-3 flex items-center justify-center">
            {/* Use the first letter of the company name as a placeholder */}
            <span className="text-2xl font-bold text-primary">
              {company.name.charAt(0)}
            </span>
          </div>
          <h3 className="font-medium text-sm">{company.name}</h3>
          <p className="text-xs text-muted">{company.openPositions} open positions</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CompanyCard;
