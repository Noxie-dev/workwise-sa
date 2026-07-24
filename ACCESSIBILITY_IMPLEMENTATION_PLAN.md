# TalentSquare Accessibility Baseline and Personalisation Plan

## Current status

The first runtime-hardening increment is implemented and undergoing verification. It must not be
described as WCAG conformant, EAA compliant, legally protective, or ready for unrestricted
production deployment until the complete evaluation scope and manual test matrix pass.

### Implemented

- Accessibility preferences are mounted in the canonical `client/src/core/app.tsx` application.
- Stored preferences are validated, versioned, migrated from the legacy key, and applied before
  React renders.
- System colour-scheme and reduced-motion preferences are supported.
- Text size, line spacing, colour theme, motion, interaction target, and focus preferences have
  real runtime effects.
- Preferences remain local to the browser and synchronize between tabs.
- The settings dialog uses focus-managed Radix primitives and labelled controls.
- Global access is available through skip links, the profile settings action, and the footer.
- Browser zoom is preserved.
- The former floating accessibility action button and unimplemented feature toggles were removed.
- Profile edit, image upload, and professional-image viewer overlays use accessible dialogs.
- Automated preference and axe checks are available through `pnpm run test:a11y`.
- JSX accessibility lint rules are enabled.

### Pending verification

- Full keyboard-only candidate journeys
- 320 CSS-pixel reflow
- Browser zoom at 200% and 400%
- Forced-colours mode
- Text-spacing overrides
- macOS/iOS VoiceOver
- Android TalkBack
- Windows NVDA with Chrome and Firefox
- Contrast verification for every supported theme and component state
- Advertisement, sponsored-content, toast, error, upload, and application-flow checks

## Product principles

Accessibility is the default product baseline. Personalisation controls enhance that baseline but
must never be required to browse jobs, create a profile, upload a CV, submit an application, or
recover from an error.

TalentSquare uses 44 by 44 CSS pixels as its preferred ergonomic interaction target. WCAG 2.2
Level AA criterion 2.5.8 uses 24 by 24 CSS pixels subject to its defined exceptions.

The application supports portrait and landscape layouts. It does not lock device orientation.

## Preference architecture

The version 1 schema contains only implemented preferences:

- Text size: small, default, large, extra large
- Line spacing: normal or looser
- Colour theme: system, light, dark, or high contrast
- Motion: system, reduce, or allow
- Larger interaction targets
- Enhanced focus indicators

Preferences are stored in `talentsquare-accessibility-settings`. Invalid and unavailable storage
falls back safely. The previous `workwise-accessibility-settings` value is read as a migration
source, but unsupported legacy fields are not exposed.

Preferences are not:

- Synced across devices
- Written to candidate profiles
- Shared with employers or recruiters
- Used for recommendations, ranking, advertising, or SquareJUMP
- Treated as evidence of a health condition or disability

## Deferred capabilities

Text-to-speech, voice navigation, caption control, reading mode, gesture modes, haptics, native
mobile shortcuts, and one-handed alternate layouts are not current product capabilities. They
must not reappear as settings until they have a defined user need, privacy review, implementation,
and assistive-technology test evidence.

## Release gates

Run:

```bash
pnpm run type-check
pnpm run test:a11y
pnpm run test:client
pnpm run build:client
```

Automated checks supplement rather than replace manual testing. A Lighthouse or axe result cannot
establish conformance for a complete candidate process.

## Release wording

Until formal evaluation is complete, use:

> TalentSquare is improving its experience toward WCAG 2.2 Level AA and is validating complete
> candidate journeys with automated and manual accessibility testing.

Do not use “WCAG compliant”, “EAA ready”, “legally protected”, or “accessible to everyone”.
