import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserMenu from '@/components/UserMenu';
import AdminButton from '@/components/AdminButton';
import { ProductMark } from '@/components/brand/ProductShell';
import { talentSquare } from '@/config/brand';

// Navigation items configuration
const navigationItems = [
  { href: talentSquare.products.jobs.href, label: talentSquare.products.jobs.label, id: 'jobs' },
  { href: talentSquare.products.squareUp.href, label: talentSquare.products.squareUp.label, id: 'square-up' },
  { href: talentSquare.products.salaryHub.href, label: talentSquare.products.salaryHub.label, id: 'salary-hub' },
  { href: talentSquare.products.passport.href, label: talentSquare.products.passport.label, id: 'talent-passport' },
  { href: talentSquare.products.tradeSquare.href, label: talentSquare.products.tradeSquare.label, id: 'trade-square' },
] as const;

/**
 * Navigation Link Component
 * Renders a navigation link with active state styling
 */
interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  className?: string;
  onClick?: () => void;
  tone?: 'default' | 'light';
}

const NavLink = ({ href, label, isActive, className, onClick, tone = 'default' }: NavLinkProps) => {
  const lightTone = isActive
    ? 'text-[#102a47] underline decoration-[#f2c94c] underline-offset-4'
    : 'text-[#102a47]/85 hover:text-[#102a47]';
  const defaultTone = isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary';

  return (
    <Link
      href={href}
      className={cn(
        'font-medium text-sm transition-colors duration-200',
        tone === 'light' ? lightTone : defaultTone,
        className
      )}
      onClick={onClick}
    >
      {label}
    </Link>
  );
};

/**
 * Logo Component
 * Renders the TalentSquare wordmark without depending on legacy logo assets.
 */
const Logo = () => (
  <Link href="/" className="flex items-center group">
    <ProductMark className="text-xl transition-transform duration-200 group-hover:scale-105 sm:text-2xl" />
    <span className="sr-only">TalentSquare Home</span>
  </Link>
);

/**
 * Mobile Navigation Component
 * Handles mobile navigation using Sheet component
 */
interface MobileNavProps {
  navigationItems: readonly { href: string; label: string; id: string }[];
  currentPath: string;
}

const MobileNav = ({ navigationItems, currentPath }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 sm:w-80">
        <div className="flex flex-col space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col space-y-4">
            {navigationItems.map(item => (
              <NavLink
                key={item.id}
                href={item.href}
                label={item.label}
                isActive={currentPath === item.href}
                className="text-base py-2"
                onClick={handleLinkClick}
              />
            ))}
          </nav>

          <div className="border-t pt-4 space-y-4">
            <AdminButton variant="outline" className="w-full" />
            <UserMenu className="w-full" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Desktop Navigation Component
 * Handles desktop navigation layout
 */
interface DesktopNavProps {
  navigationItems: readonly { href: string; label: string; id: string }[];
  currentPath: string;
}

const DesktopNav = ({ navigationItems, currentPath }: DesktopNavProps) => (
  <nav className="hidden lg:flex items-center space-x-5">
    <ul className="flex items-center space-x-4">
      {navigationItems.map(item => (
        <li key={item.id}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={currentPath === item.href}
            tone="light"
          />
        </li>
      ))}
    </ul>

    <div className="flex items-center space-x-3 ml-4 border-l border-[#102a47]/25 pl-4">
      <AdminButton
        variant="outline"
        className="border-[#102a47]/30 text-[#102a47] hover:bg-[#f2c94c]/15"
      />
      <UserMenu />
    </div>
  </nav>
);

/**
 * Header Component
 * Main header component with responsive navigation
 */
const Header = () => {
  const [location] = useLocation();

  // Memoize current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => location, [location]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 text-[#102a47] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <DesktopNav navigationItems={navigationItems} currentPath={currentPath} />

          {/* Mobile Navigation */}
          <MobileNav navigationItems={navigationItems} currentPath={currentPath} />
        </div>
      </div>
    </header>
  );
};

export default Header;
