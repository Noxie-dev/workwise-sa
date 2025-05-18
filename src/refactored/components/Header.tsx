import React, { useState, memo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useUserMenu } from '../hooks/useUserMenu';
import { useAdminAuth } from '../hooks/useAdminAuth';

/**
 * Props for Header component
 */
interface HeaderProps {
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Header component for WorkWise SA
 *
 * Features:
 * - Responsive design with mobile menu
 * - Active link highlighting
 * - Accessibility improvements
 * - Performance optimization with memo
 */
const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAdmin } = useAdminAuth();
  const { isAuthenticated, userDisplayName, handleLogout } = useUserMenu();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Navigation links configuration
  const navLinks = [
    { href: '/jobs', label: 'Find Jobs' },
    { href: '/companies', label: 'Companies' },
    { href: '/cv-builder', label: 'CV Builder' },
    { href: '/wise-up', label: 'Wise-Up' },
    { href: '/blog-wise', label: 'Blog Wise' },
    { href: '/resources', label: 'Resources' }
  ];

  return (
    <header className={`sticky top-0 bg-white border-b border-border z-50 shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo.png"
              alt="WorkWise SA Logo"
              className="h-20 sm:h-24 mr-2 transition-all duration-200 hover:scale-105"
              width="96"
              height="96"
            />
          </Link>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-6" aria-label="Main Navigation">
          <ul className="flex space-x-6">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-dark hover:text-primary font-medium ${location === href ? 'text-primary' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">{userDisplayName || 'Profile'}</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-dark focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-2"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-t border-gray-100 py-4 px-6"
          role="navigation"
          aria-label="Mobile Navigation"
        >
          <ul className="space-y-4">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block text-dark hover:text-primary font-medium ${location === href ? 'text-primary' : ''}`}
                  onClick={closeMenu}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-3 border-t border-gray-100">
              <div className="flex flex-col space-y-3">
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/admin" onClick={closeMenu}>Admin</Link>
                  </Button>
                )}

                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/profile" onClick={closeMenu}>{userDisplayName || 'Profile'}</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button variant="default" size="sm" asChild className="w-full">
                    <Link href="/login" onClick={closeMenu}>Login</Link>
                  </Button>
                )}
              </div>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default memo(Header);
