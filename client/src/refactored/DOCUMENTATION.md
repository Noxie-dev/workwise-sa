# WorkWise SA Refactored Components Documentation

## LazyVideo Component

The `LazyVideo` component is a performance-optimized video player that implements lazy loading, responsive quality selection, and robust error handling.

### Features

- **Lazy Loading**: Videos are only loaded when they enter the viewport, saving bandwidth and improving page load times
- **Responsive Quality**: Automatically serves lower quality videos on mobile devices
- **Error Handling**: Provides graceful fallbacks when videos fail to load
- **Accessibility**: Includes proper ARIA attributes and keyboard support
- **Performance Optimization**: Uses React.memo to prevent unnecessary re-renders
- **Autoplay Control**: Supports autoplay on visibility with configurable options
- **Custom Loading & Error States**: Allows custom content for loading and error states

### Usage

```tsx
import { LazyVideo } from '@/refactored/components/LazyVideo';

// Basic usage
<LazyVideo src="/videos/example.mp4" />

// With all options
<LazyVideo
  src="/videos/example.mp4"
  poster="/images/poster.jpg"
  className="rounded-lg"
  onLoad={() => console.log('Video loaded')}
  isMobile={isMobileDevice}
  fallbackContent={<p>Custom error message</p>}
  loadingContent={<CustomSpinner />}
  autoplay={false}
  autoPlayOnVisible={true}
  loop={true}
  muted={true}
  controls={true}
  threshold={0.5}
  rootMargin="100px"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | (required) | URL of the video to load |
| `poster` | string | undefined | URL of the poster image to show before video loads |
| `className` | string | undefined | CSS class to apply to the video element |
| `onLoad` | () => void | undefined | Callback function called when video is loaded |
| `isMobile` | boolean | undefined | Flag to indicate if the device is mobile (for quality selection) |
| `fallbackContent` | React.ReactNode | undefined | Custom content to show when video fails to load |
| `loadingContent` | React.ReactNode | undefined | Custom content to show while video is loading |
| `autoplay` | boolean | false | Whether to autoplay the video when loaded |
| `autoPlayOnVisible` | boolean | false | Whether to autoplay the video when it enters the viewport |
| `loop` | boolean | false | Whether to loop the video |
| `muted` | boolean | true | Whether to mute the video |
| `controls` | boolean | false | Whether to show video controls |
| `threshold` | number | 0.1 | IntersectionObserver threshold (0-1) |
| `rootMargin` | string | '50px' | IntersectionObserver root margin |

### Implementation Details

The component uses the `useLazyVideo` custom hook to handle the video loading logic, which:

1. Creates an IntersectionObserver to detect when the video enters the viewport
2. Only loads the video when it's visible to the user
3. Handles loading states and error conditions
4. Optimizes for mobile by loading lower quality versions when available
5. Controls playback based on visibility and configuration

### Accessibility

- Includes proper ARIA attributes for screen readers
- Provides visual indicators for loading and error states
- Supports keyboard navigation when controls are enabled

### Performance Considerations

- Uses React.memo to prevent unnecessary re-renders
- Only loads video content when visible in the viewport
- Automatically pauses videos when they're not visible (unless loop is enabled)
- Supports device-based quality selection to reduce bandwidth usage on mobile

### Testing

The component includes comprehensive tests covering:

- Basic rendering and prop application
- Loading and error states
- Mobile optimization
- Autoplay behavior
- Visibility-based playback control

## useLazyVideo Hook

The `useLazyVideo` hook extracts the video loading logic from the LazyVideo component, making it reusable across different components.

### Usage

```tsx
import { useLazyVideo } from '@/refactored/hooks/useLazyVideo';

function CustomVideoPlayer({ src }) {
  const { 
    videoRef, 
    isLoaded, 
    isLoading, 
    isError, 
    isVisible 
  } = useLazyVideo({
    src,
    isMobile: true,
    autoPlayOnVisible: true
  });

  return (
    <div>
      <video ref={videoRef} />
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading video</p>}
    </div>
  );
}
```

### Parameters

The hook accepts an options object with the following properties:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | (required) | URL of the video to load |
| `isMobile` | boolean | undefined | Flag to indicate if the device is mobile |
| `onLoad` | () => void | undefined | Callback function called when video is loaded |
| `autoPlayOnVisible` | boolean | false | Whether to autoplay when video becomes visible |
| `loop` | boolean | false | Whether to loop the video |
| `threshold` | number | 0.1 | IntersectionObserver threshold |
| `rootMargin` | string | '50px' | IntersectionObserver root margin |

### Return Value

The hook returns an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `videoRef` | React.RefObject<HTMLVideoElement> | Ref to attach to the video element |
| `isLoaded` | boolean | Whether the video has loaded |
| `isLoading` | boolean | Whether the video is currently loading |
| `isError` | boolean | Whether there was an error loading the video |
| `isVisible` | boolean | Whether the video is currently visible in the viewport |

## Migration Guide

To migrate from the original LazyVideo component to the refactored version:

### Update Imports

```tsx
// Before
import { LazyVideo } from '@/components/LazyVideo';

// After
import { LazyVideo } from '@/refactored/components/LazyVideo';
// or use the default export
import LazyVideo from '@/refactored/components/LazyVideo';
```

### Update Props

The refactored component supports additional props:

```tsx
// Before
<LazyVideo 
  src="/videos/example.mp4" 
  poster="/images/poster.jpg"
  className="rounded-lg"
  onLoad={() => console.log('Video loaded')}
  isMobile={isMobileDevice}
/>

// After - with new options
<LazyVideo 
  src="/videos/example.mp4" 
  poster="/images/poster.jpg"
  className="rounded-lg"
  onLoad={() => console.log('Video loaded')}
  isMobile={isMobileDevice}
  // New props
  autoPlayOnVisible={true}
  loop={true}
  muted={true}
  controls={true}
  fallbackContent={<CustomErrorComponent />}
  loadingContent={<CustomLoadingComponent />}
/>
```

### Using the Hook Directly

For more control, you can use the hook directly:

```tsx
import { useLazyVideo } from '@/refactored/hooks/useLazyVideo';

function CustomVideoPlayer() {
  const { 
    videoRef, 
    isLoaded, 
    isLoading, 
    isError 
  } = useLazyVideo({
    src: '/videos/example.mp4',
    isMobile: true
  });

  // Custom UI and behavior
  return (
    <div className="custom-player">
      <video ref={videoRef} className="custom-video" />
      {/* Custom UI based on states */}
    </div>
  );
}
```
