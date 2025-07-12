import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserMenu from '@/components/UserMenu';
import AdminButton from '@/components/AdminButton';

// Navigation items configuration
const navigationItems = [
  { href: '/jobs', label: 'Find Jobs', id: 'jobs' },
  { href: '/companies', label: 'Companies', id: 'companies' },
  { href: '/cv-builder', label: 'CV Builder', id: 'cv-builder' },
  { href: '/wise-up', label: 'Wise-Up', id: 'wise-up' },
  { href: '/blog-wise', label: 'Blog Wise', id: 'blog-wise' },
  { href: '/resources', label: 'Resources', id: 'resources' },
  { href: '/contact', label: 'Contact', id: 'contact' },
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
}

const NavLink = ({ href, label, isActive, className, onClick }: NavLinkProps) => (
  <Link
    href={href}
    className={cn(
      'font-medium text-sm transition-colors duration-200 hover:text-primary',
      isActive ? 'text-primary' : 'text-muted-foreground',
      className
    )}
    onClick={onClick}
  >
    {label}
  </Link>
);

/**
 * Logo Component
 * Renders the WorkWise SA logo with proper accessibility
 */
const Logo = () => (
  <Link href="/" className="flex items-center group">
    <img
      src="/images/logo.png"
      alt="WorkWise SA - Job Search Platform"
      className="h-20 sm:h-24 mr-2 transition-transform duration-200 group-hover:scale-105"
      loading="lazy"
    />
    <span className="sr-only">WorkWise SA Home</span>
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
          className="md:hidden"
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
            {navigationItems.map((item) => (
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
  <nav className="hidden md:flex items-center space-x-8">
    <ul className="flex items-center space-x-6">
      {navigationItems.map((item) => (
        <li key={item.id}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={currentPath === item.href}
          />
        </li>
      ))}
    </ul>
    
    <div className="flex items-center space-x-3 ml-6 border-l border-border pl-6">
      <AdminButton variant="outline" />
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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <DesktopNav
            navigationItems={navigationItems}
            currentPath={currentPath}
          />

          {/* Mobile Navigation */}
          <MobileNav
            navigationItems={navigationItems}
            currentPath={currentPath}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
