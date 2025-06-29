import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { getIcon } from '@/utils/iconMap';
import { type Category } from '@shared/schema';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link href={`/jobs?category=${category.slug}`}>
      <Card className="bg-light rounded-lg p-4 text-center hover:shadow-card transition-all group cursor-pointer">
        <CardContent className="p-0">
          <div className="bg-blue-50 text-primary p-3 rounded-full inline-flex justify-center items-center mb-3 w-14 h-14 group-hover:bg-primary group-hover:text-white transition-colors">
            {getIcon(category.icon as any)}
          </div>
          <h3 className="font-medium">{category.name}</h3>
          <p className="text-sm text-muted mt-1">{category.jobCount}+ Jobs</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
