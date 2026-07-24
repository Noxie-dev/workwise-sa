# TalentSquare Accessibility Preferences

Accessibility preferences are globally available from:

- The first keyboard-focusable skip links
- The profile settings button
- The “Accessibility preferences” footer button

The dialog provides implemented controls for text size, line spacing, colour theme, motion,
interaction target size, and focus visibility. Preferences are stored only in the current browser.

## Development

The canonical integration is:

- Provider: `client/src/core/app.tsx`
- Startup application: `client/src/main.tsx`
- Storage and validation: `client/src/lib/accessibilityPreferences.ts`
- Context: `client/src/contexts/AccessibilityContext.tsx`
- Dialog: `client/src/components/accessibility/AccessibilitySettingsModal.tsx`
- Styles: `client/src/styles/accessibility.css`

Run focused verification with:

```bash
pnpm run type-check
pnpm run test:a11y
pnpm run build:client
```

## Manual checks

1. Press Tab from the top of a page and use each skip link.
2. Open the preferences dialog from the footer and confirm focus moves into it.
3. Navigate every control using the keyboard and confirm selected states are announced.
4. Close with Escape and confirm focus returns to the trigger.
5. Reload and confirm preferences persist.
6. Change the system dark-mode and reduced-motion settings while “System” is selected.
7. Test at 320 CSS pixels and at 200% and 400% zoom.
8. Test Windows forced colours and the supported screen-reader/browser matrix.

Passing automated checks does not establish WCAG conformance. Record manual evidence for the
complete candidate journeys before changing release or compliance wording.
