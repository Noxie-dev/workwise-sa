# LoadingScreen Component

The `LoadingScreen` component provides a consistent loading experience across the application. It can be used during data fetching, page transitions, or any asynchronous operation.

## Features

- **Configurable spinner size**: Choose from small, medium, or large spinner sizes
- **Full-page or inline display**: Use as a full-page overlay or inline within a container
- **Custom spinner support**: Provide your own spinner component
- **Customizable message**: Display a custom loading message
- **Backdrop blur effect**: Apply different blur strengths to the background
- **Accessibility**: Includes proper ARIA attributes for screen readers
- **Performance optimized**: Uses React.memo to prevent unnecessary re-renders

## Usage

```tsx
import { LoadingScreen } from '@/components/ui/loading-screen';

// Basic usage
<LoadingScreen />

// With custom message
<LoadingScreen message="Processing your request..." />

// Inline loading (not full-page)
<LoadingScreen fullPage={false} />

// Large spinner with medium blur
<LoadingScreen size="lg" backdropBlur="md" />

// With custom spinner component
<LoadingScreen customSpinner={<YourCustomSpinner />} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | "Loading..." | Text displayed below the spinner |
| `className` | string | "" | Additional CSS classes |
| `size` | "sm" \| "md" \| "lg" | "md" | Size of the spinner |
| `fullPage` | boolean | true | Whether to display as a full-page overlay |
| `customSpinner` | ReactNode | undefined | Custom spinner component |
| `backdropBlur` | "none" \| "sm" \| "md" \| "lg" | "sm" | Strength of backdrop blur effect |
| `zIndex` | number | 50 | Z-index for the loading screen |

## Examples

### Default Loading Screen

```tsx
<LoadingScreen />
```

### Custom Message

```tsx
<LoadingScreen message="Processing your request..." />
```

### Inline Loading

```tsx
<div className="border p-6 rounded-lg">
  <LoadingScreen fullPage={false} message="Loading content..." />
</div>
```

### Large Spinner with Medium Blur

```tsx
<LoadingScreen size="lg" backdropBlur="md" message="Loading large content..." />
```

### With Custom Spinner

```tsx
import { Spinner } from '@/components/custom/spinner';

<LoadingScreen customSpinner={<Spinner color="blue" />} />
```

## Accessibility

The LoadingScreen component includes the following accessibility features:

- `role="alert"` to announce the loading state to screen readers
- `aria-live="assertive"` to ensure screen readers announce the loading state immediately
- `aria-busy="true"` to indicate that the page or section is busy loading
- Spinner is marked with `aria-hidden="true"` as it's decorative and the loading message provides the necessary context
