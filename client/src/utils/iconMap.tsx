import {
  Laptop,
  ChartLine,
  BellRing,
  UserRound,
  GraduationCap,
  Heart,
  Search,
  ChevronRight,
  Briefcase,
  Clock,
  MapPin,
  CreditCard,
  Award,
  Phone,
  Mail,
  Building,
  Lock,
  User,
  ShoppingCart,
  Shield,
  Fuel,
  Baby,
  Trash2,
  Flower2,
  ShieldCheck,
  Brush,
} from 'lucide-react';

type IconName =
  | 'laptop-code'
  | 'chart-line'
  | 'bullhorn'
  | 'user-md'
  | 'graduation-cap'
  | 'heart'
  | 'search'
  | 'chevron-right'
  | 'briefcase'
  | 'clock'
  | 'map-pin'
  | 'credit-card'
  | 'award'
  | 'phone'
  | 'mail'
  | 'building'
  | 'lock'
  | 'user'
  | 'shopping-cart'
  | 'shield'
  | 'gas-pump'
  | 'baby'
  | 'broom'
  | 'seedling'
  // API icons
  | 'computer'
  | 'money'
  | 'medical'
  | 'school'
  | 'chart'
  | 'engineering'
  | 'hotel'
  | 'office';

const iconMap: Record<IconName, React.ReactNode> = {
  'laptop-code': <Laptop className="w-5 h-5" />,
  'chart-line': <ChartLine className="w-5 h-5" />,
  'bullhorn': <BellRing className="w-5 h-5" />,
  'user-md': <UserRound className="w-5 h-5" />,
  'graduation-cap': <GraduationCap className="w-5 h-5" />,
  'heart': <Heart className="w-5 h-5" />,
  'search': <Search className="w-5 h-5" />,
  'chevron-right': <ChevronRight className="w-5 h-5" />,
  'briefcase': <Briefcase className="w-5 h-5" />,
  'clock': <Clock className="w-5 h-5" />,
  'map-pin': <MapPin className="w-5 h-5" />,
  'credit-card': <CreditCard className="w-5 h-5" />,
  'award': <Award className="w-5 h-5" />,
  'phone': <Phone className="w-5 h-5" />,
  'mail': <Mail className="w-5 h-5" />,
  'building': <Building className="w-5 h-5" />,
  'lock': <Lock className="w-5 h-5" />,
  'user': <User className="w-5 h-5" />,
  'shopping-cart': <ShoppingCart className="w-5 h-5" />,
  'shield': <Shield className="w-5 h-5" />,
  'gas-pump': <Fuel className="w-5 h-5" />,
  'baby': <Baby className="w-5 h-5" />,
  'broom': <Brush className="w-5 h-5" />,
  'seedling': <Flower2 className="w-5 h-5" />,

  // API icons - map to existing icons
  'computer': <Laptop className="w-5 h-5" />,
  'money': <CreditCard className="w-5 h-5" />,
  'medical': <Heart className="w-5 h-5" />,
  'school': <GraduationCap className="w-5 h-5" />,
  'chart': <ChartLine className="w-5 h-5" />,
  'engineering': <Briefcase className="w-5 h-5" />,
  'hotel': <Building className="w-5 h-5" />,
  'office': <Building className="w-5 h-5" />,
};

export const getIcon = (name: any) => {
  // If the name is not in our IconName type, return a default icon
  if (!name || !(name in iconMap)) {
    return iconMap['briefcase']; // Default icon
  }
  return iconMap[name as IconName];
};

export default iconMap;
