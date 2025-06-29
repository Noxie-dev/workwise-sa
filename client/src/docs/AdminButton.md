# AdminButton Component

The `AdminButton` component provides a dropdown menu for admin users to access various administrative features of the WorkWise SA platform.

## Features

- Only visible to admin users
- Customizable appearance (variant, text, icon)
- Permission-based menu items
- Support for custom menu items
- Memoized to prevent unnecessary re-renders

## Usage

```tsx
import AdminButton from '@/components/AdminButton';

// Basic usage
<AdminButton />

// With custom styling
<AdminButton 
  variant="secondary" 
  className="my-custom-class" 
  buttonText="Admin Panel" 
  showIcon={false} 
/>

// With custom menu items
<AdminButton 
  customMenuItems={[
    {
      href: "/custom-admin-page",
      icon: <CustomIcon className="mr-2 h-4 w-4" />,
      label: "Custom Admin Page"
    }
  ]} 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"outline"` | Button variant |
| `className` | `string` | `""` | Additional CSS classes |
| `showIcon` | `boolean` | `true` | Whether to show the admin icon |
| `buttonText` | `string` | `"Admin"` | Text to display on the button |
| `customMenuItems` | `Array<{ href: string; icon?: React.ReactNode; label: string; }>` | `undefined` | Custom menu items to render instead of defaults |

## Admin Authentication

The component uses the `useAdminAuth` hook to determine if the current user has admin privileges and what permissions they have. If the user is not an admin, the component renders nothing.

## Default Menu Items

The default menu items include:

- Dashboard (`/admin`)
- Marketing Rules (`/marketing-rules`)
- Analytics (`/admin/analytics`)
- User Management (`/admin/users`)
- Admin Settings (`/admin/settings`)

Each menu item is filtered based on the user's permissions.

## Customization

You can fully customize the menu items by providing the `customMenuItems` prop. This will replace the default menu items with your custom ones.

## Accessibility

The component includes proper ARIA attributes for accessibility:
- The button has an `aria-label="Admin menu"`
- The icon has `aria-hidden="true"` to prevent screen readers from announcing it

## Example

```tsx
<AdminButton 
  variant="secondary"
  className="bg-blue-100"
  buttonText="Admin Portal"
  showIcon={true}
/>
```

This will render a secondary button with a blue background, the text "Admin Portal", and the admin icon.
