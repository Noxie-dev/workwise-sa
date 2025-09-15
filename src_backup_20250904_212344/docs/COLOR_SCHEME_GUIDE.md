# Color Scheme Usage in WorkWise SA Client

This project uses a comprehensive custom color palette defined in `src/styles/colors.css` and integrated with Tailwind CSS via `tailwind.config.js`.

## 🎨 Color Variables Overview

### Primary Colors - Light Blue (#63B3ED)
- **Primary**: `#63B3ED` - Main brand color
- **Primary Hover**: `#4299E1` - Darker shade for hover states
- **Primary Light**: `#BEE3F8` - Light shade for backgrounds
- **Primary Dark**: `#2B6CB0` - Dark shade for emphasis

### Secondary Colors - Light Gray (#E2E8F0)
- **Secondary**: `#E2E8F0` - Neutral secondary color
- **Secondary Hover**: `#CBD5E0` - Hover state
- **Secondary Light**: `#F7FAFC` - Very light shade
- **Secondary Dark**: `#A0AEC0` - Darker neutral

### Accent Colors - Yellow/Gold (#ECC94B)
- **Accent**: `#ECC94B` - Highlight and call-to-action color
- **Accent Hover**: `#D69E2E` - Hover state
- **Accent Light**: `#FAF089` - Light accent
- **Accent Dark**: `#B7791F` - Dark accent

### Status Colors
- **Success**: `#38A169` (Green) - Success states, confirmations
- **Warning**: `#DD6B20` (Orange) - Warnings, cautions
- **Info**: `#3182CE` (Blue) - Information, tips
- **Destructive**: `#E53E3E` (Red) - Errors, deletions

### WorkWise Brand Colors
- **WorkWise Blue**: `#2A4365` - Main brand blue
- **WorkWise Yellow**: `#F6E05E` - Brand accent yellow

## 🚀 How to Use Colors in Components

### Tailwind Utility Classes

#### Background Colors
```jsx
// Primary colors
<div className="bg-primary">Primary background</div>
<div className="bg-primary-light">Light primary background</div>
<div className="bg-primary-dark">Dark primary background</div>

// Secondary colors
<div className="bg-secondary">Secondary background</div>
<div className="bg-secondary-light">Light secondary background</div>

// Status colors
<div className="bg-success">Success background</div>
<div className="bg-warning">Warning background</div>
<div className="bg-info">Info background</div>
<div className="bg-destructive">Error background</div>

// Brand colors
<div className="bg-workwise-blue">WorkWise blue background</div>
<div className="bg-workwise-yellow">WorkWise yellow background</div>
```

#### Text Colors
```jsx
// Primary text
<h1 className="text-primary">Primary heading</h1>
<p className="text-primary-foreground">Primary foreground text</p>

// Secondary text
<p className="text-secondary-foreground">Secondary text</p>
<p className="text-muted-foreground">Muted text</p>

// Status text
<p className="text-success">Success message</p>
<p className="text-warning">Warning message</p>
<p className="text-destructive">Error message</p>
```

#### Border Colors
```jsx
// Primary borders
<div className="border border-primary">Primary border</div>
<div className="border-2 border-primary-light">Light primary border</div>

// Status borders
<div className="border border-success">Success border</div>
<div className="border border-warning">Warning border</div>
<div className="border border-destructive">Error border</div>

// Neutral borders
<div className="border border-border">Default border</div>
<div className="border border-muted">Muted border</div>
```

#### Hover States
```jsx
// Hover effects
<button className="bg-primary hover:bg-primary-hover">
  Primary button with hover
</button>

<div className="bg-card hover:bg-card-hover">
  Card with hover effect
</div>

<div className="bg-secondary hover:bg-secondary-hover">
  Secondary with hover
</div>
```

### Complete Component Examples

#### Primary Button
```jsx
<button className="bg-primary text-primary-foreground hover:bg-primary-hover px-4 py-2 rounded-lg transition-colors">
  Primary Button
</button>
```

#### Success Alert
```jsx
<div className="bg-success-light border border-success text-success-dark p-4 rounded-lg">
  <div className="flex items-center">
    <CheckCircle className="w-5 h-5 mr-2" />
    <span>Operation completed successfully!</span>
  </div>
</div>
```

#### Warning Card
```jsx
<div className="bg-warning-light border border-warning text-warning-dark p-4 rounded-lg">
  <div className="flex items-center">
    <AlertTriangle className="w-5 h-5 mr-2" />
    <span>Please review your information before proceeding.</span>
  </div>
</div>
```

#### Info Card
```jsx
<div className="bg-info-light border border-info text-info-dark p-4 rounded-lg">
  <div className="flex items-center">
    <Info className="w-5 h-5 mr-2" />
    <span>This feature is currently in beta.</span>
  </div>
</div>
```

#### Error State
```jsx
<div className="bg-destructive-light border border-destructive text-destructive-dark p-4 rounded-lg">
  <div className="flex items-center">
    <XCircle className="w-5 h-5 mr-2" />
    <span>Something went wrong. Please try again.</span>
  </div>
</div>
```

#### WorkWise Brand Card
```jsx
<div className="bg-workwise-blue text-white p-6 rounded-lg">
  <h2 className="text-2xl font-bold mb-2">WorkWise SA</h2>
  <p className="text-workwise-yellow-light">Your career partner</p>
</div>
```

## 🎯 Color Usage Guidelines

### When to Use Each Color

#### Primary Colors
- **Primary**: Main CTAs, primary buttons, links, active states
- **Primary Light**: Subtle backgrounds, disabled states
- **Primary Dark**: Emphasis, hover states, active elements

#### Secondary Colors
- **Secondary**: Secondary buttons, neutral backgrounds
- **Secondary Light**: Page backgrounds, subtle sections
- **Secondary Dark**: Borders, dividers, subtle text

#### Accent Colors
- **Accent**: Highlights, special CTAs, badges
- **Accent Light**: Subtle highlights, backgrounds
- **Accent Dark**: Strong emphasis, important elements

#### Status Colors
- **Success**: Confirmations, completed states, positive feedback
- **Warning**: Cautions, pending states, attention needed
- **Info**: Tips, information, neutral notifications
- **Destructive**: Errors, deletions, critical actions

### Accessibility Considerations

1. **Contrast Ratios**: All color combinations meet WCAG AA standards
2. **Color Blindness**: Don't rely solely on color to convey information
3. **Focus States**: Use `ring-primary` for focus indicators
4. **Hover States**: Always provide visual feedback on interactive elements

### Dark Mode Support

The color system includes dark mode variants that automatically activate based on user preference:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #1A202C;
    --foreground: #F7FAFC;
    --card: #2D3748;
    /* ... other dark mode colors */
  }
}
```

## 🛠️ Customization

### Adding New Colors

1. **Add to `colors.css`**:
```css
:root {
  --custom-color: #FF6B6B;
  --custom-color-foreground: #ffffff;
  --custom-color-hover: #FF5252;
}
```

2. **Add to `tailwind.config.js`**:
```js
colors: {
  custom: {
    DEFAULT: 'var(--custom-color)',
    foreground: 'var(--custom-color-foreground)',
    hover: 'var(--custom-color-hover)',
  },
}
```

3. **Use in components**:
```jsx
<div className="bg-custom text-custom-foreground hover:bg-custom-hover">
  Custom colored element
</div>
```

### Modifying Existing Colors

To change the color scheme, simply update the CSS variables in `src/styles/colors.css`:

```css
:root {
  --primary: #YOUR_NEW_COLOR;
  --primary-hover: #YOUR_NEW_HOVER_COLOR;
  /* ... */
}
```

## 📱 Responsive Color Usage

Colors work seamlessly across all device sizes. Use responsive prefixes when needed:

```jsx
<div className="bg-primary md:bg-primary-dark lg:bg-primary-light">
  Responsive background color
</div>
```

## 🎨 Design System Integration

The color system integrates with:
- **Shadcn/UI Components**: All components use the color variables
- **Tailwind CSS**: Full utility class support
- **CSS Variables**: Direct CSS usage when needed
- **Dark Mode**: Automatic theme switching
- **Accessibility**: WCAG compliant contrast ratios

## 📚 Additional Resources

- [Tailwind CSS Colors Documentation](https://tailwindcss.com/docs/customizing-colors)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS Custom Properties (Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

For more details, see `tailwind.config.js` and `src/styles/colors.css`.