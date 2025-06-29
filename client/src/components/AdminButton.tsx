import React, { memo } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

/**
 * Props for AdminButton component
 */
interface AdminButtonProps {
  /**
   * Optional variant for the button
   * @default "outline"
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  /**
   * Optional CSS class to apply to the button
   */
  className?: string;

  /**
   * Whether to show the admin icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom button text
   * @default "Admin"
   */
  buttonText?: string;

  /**
   * Custom admin menu items to render
   * Each item should have an href, icon, and label
   */
  customMenuItems?: Array<{
    href: string;
    icon?: React.ReactNode;
    label: string;
  }>;
}

/**
 * AdminButton Component
 *
 * Renders a dropdown button with admin features, only visible to admin users
 */
const AdminButton: React.FC<AdminButtonProps> = ({
  variant = "outline",
  className = "",
  showIcon = true,
  buttonText = "Admin",
  customMenuItems
}) => {
  const { isAdmin, hasPermission } = useAdminAuth();

  // If user is not an admin, don't render anything
  if (!isAdmin) {
    return null;
  }

  // Default menu items with permission checks
  const defaultMenuItems = [
    {
      href: "/admin",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      label: "Dashboard",
      permission: "dashboard:view"
    },
    {
      href: "/marketing-rules",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      label: "Marketing Rules",
      permission: "marketing:view"
    },
    {
      href: "/admin/analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      label: "Analytics",
      permission: "analytics:view"
    },
    {
      href: "/admin/users",
      icon: <Users className="mr-2 h-4 w-4" />,
      label: "User Management",
      permission: "users:view"
    },
    {
      href: "/admin/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      label: "Admin Settings",
      permission: "settings:view"
    },
  ];

  // Filter menu items based on permissions
  const menuItems = customMenuItems || defaultMenuItems.filter(item =>
    !item.permission || hasPermission(item.permission as any)
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          className={`flex items-center gap-2 ${className}`}
          aria-label="Admin menu"
        >
          {showIcon && <ShieldAlert className="h-4 w-4" aria-hidden="true" />}
          <span>{buttonText}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={4}>
        <DropdownMenuLabel>Admin Dashboard</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item, index) => (
            <DropdownMenuItem key={index} asChild>
              <Link
                href={item.href}
                className="cursor-pointer flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(AdminButton);
