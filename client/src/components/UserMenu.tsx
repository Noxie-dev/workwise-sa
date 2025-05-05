import React, { memo } from 'react';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Settings,
  LogOut,
  FileText,
  Briefcase,
  BarChart3,
  LineChart
} from 'lucide-react';
import { useUserMenu } from '@/hooks/useUserMenu';

interface UserMenuProps {
  className?: string;
}

/**
 * UserMenu component
 *
 * Displays either login/register buttons or user dropdown menu
 * based on authentication state
 */
const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const {
    isAuthenticated,
    userDisplayName,
    userEmail,
    userPhotoURL,
    userInitials,
    isAdmin,
    handleLogout
  } = useUserMenu();

  // Render login and register buttons for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className={`flex items-center space-x-3 ${className || ''}`}>
        <Link
          href="/login"
          className="text-primary hover:text-primary-dark font-medium transition-colors"
        >
          Login
        </Link>
        <Button
          asChild
          className="bg-primary text-white hover:bg-blue-500 transition-colors"
        >
          <Link href="/register">Register</Link>
        </Button>
      </div>
    );
  }

  // Render user dropdown menu for authenticated users
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-8 w-8 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="User menu"
          >
            <Avatar>
              <AvatarImage
                src={userPhotoURL}
                alt={userDisplayName}
                loading="lazy"
              />
              <AvatarFallback className="bg-primary text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userDisplayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer flex items-center">
                <User className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/applications" className="cursor-pointer flex items-center">
                <Briefcase className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Applications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer flex items-center">
                <LineChart className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Job Market Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/cv-builder" className="cursor-pointer flex items-center">
                <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>CV Builder</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer flex items-center">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/marketing-rules" className="cursor-pointer flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Marketing Rules</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(UserMenu);