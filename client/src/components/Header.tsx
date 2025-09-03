import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserMenu from '@/components/UserMenu';
import AdminButton from '@/components/AdminButton';
import '@/styles/header-mobile.css';

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
      'font-medium text-sm transition-colors duration-200 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md',
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
 * Renders the WorkWise SA logo with responsive sizing
 */
const Logo = () => (
  <Link href="/" className="flex items-center group">
    <img
      src="/images/logo.png"
      alt="WorkWise SA - Job Search Platform"
      className="h-16 sm:h-20 md:h-24 transition-transform duration-200 group-hover:scale-105 header-logo-mobile header-logo-xs header-logo-landscape header-high-dpi"
      loading="lazy"
    />
    <span className="sr-only">WorkWise SA Home</span>
  </Link>
);

/**
 * Mobile Navigation Component
 * Enhanced mobile navigation with better UX and accessibility
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
          className="md:hidden h-10 w-10 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mobile-nav-trigger"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm sm:max-w-md p-0 mobile-sheet-content">
        <div className="flex flex-col h-full">
          {/* Header with Logo and Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mobile-nav-trigger"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 mobile-nav-link',
                    'hover:bg-gray-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    currentPath === item.href 
                      ? 'bg-primary/10 text-primary border-l-4 border-primary active' 
                      : 'text-muted-foreground'
                  )}
                  onClick={handleLinkClick}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          
          {/* Bottom Actions */}
          <div className="border-t border-border p-4 space-y-3">
            <AdminButton variant="outline" className="w-full h-11 text-base mobile-action-button" />
            <UserMenu className="w-full mobile-action-button" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Desktop Navigation Component
 * Enhanced desktop navigation with better spacing and hover effects
 */
interface DesktopNavProps {
  navigationItems: readonly { href: string; label: string; id: string }[];
  currentPath: string;
}

const DesktopNav = ({ navigationItems, currentPath }: DesktopNavProps) => (
  <nav className="hidden lg:flex items-center space-x-8">
    <ul className="flex items-center space-x-6">
      {navigationItems.map((item) => (
        <li key={item.id}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={currentPath === item.href}
            className="px-3 py-2 rounded-md hover:bg-gray-50"
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
 * Tablet Navigation Component
 * Intermediate navigation for tablet-sized screens
 */
interface TabletNavProps {
  navigationItems: readonly { href: string; label: string; id: string }[];
  currentPath: string;
}

const TabletNav = ({ navigationItems, currentPath }: TabletNavProps) => (
  <nav className="hidden md:flex lg:hidden items-center space-x-4 header-tablet-optimized">
    <ul className="flex items-center space-x-4">
      {navigationItems.slice(0, 4).map((item) => (
        <li key={item.id}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={currentPath === item.href}
            className="px-2 py-2 text-sm rounded-md hover:bg-gray-50 tablet-nav-item"
          />
        </li>
      ))}
    </ul>
    
    <div className="flex items-center space-x-2 ml-4 border-l border-border pl-4">
      <AdminButton variant="outline" size="sm" />
      <UserMenu />
    </div>
  </nav>
);

/**
 * Header Component
 * Enhanced header with better responsive design and mobile optimization
 */
const Header = () => {
  const [location] = useLocation();
  
  // Memoize current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => location, [location]);
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border shadow-sm header-mobile-optimized header-landscape">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 header-xs-optimized">
        <div className="flex items-center justify-between">
          {/* Logo - Responsive sizing */}
          <div className="flex items-center flex-shrink-0">
            <Logo />
          </div>

          {/* Tablet Navigation - Shows fewer items */}
          <TabletNav
            navigationItems={navigationItems}
            currentPath={currentPath}
          />

          {/* Desktop Navigation - Shows all items */}
          <DesktopNav
            navigationItems={navigationItems}
            currentPath={currentPath}
          />

          {/* Mobile Navigation - Hamburger menu */}
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
