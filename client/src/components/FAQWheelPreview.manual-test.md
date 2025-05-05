# FAQ Wheel Component Manual Test Guide

This document provides a step-by-step guide for manually testing the enhanced FAQ Wheel component.

## Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the page containing the FAQ Wheel component.

## Test Cases

### 1. Spring Animation

- **Test**: Click the left and right rotation buttons.
- **Expected**: The wheel should rotate smoothly with a natural spring-like motion.
- **Verification**: The animation should feel smooth and natural, not linear or mechanical.

### 2. Throttle Function

- **Test**: Rapidly click the rotation buttons multiple times.
- **Expected**: The rotation should be throttled to prevent excessive animations.
- **Verification**: The wheel should not jump erratically or become unresponsive.

### 3. FAQ Item Cards

- **Test**: Hover over different FAQ items.
- **Expected**: Cards should scale up slightly and show enhanced styling.
- **Verification**: Cards should display category indicators and have smooth transitions.

### 4. Modal Component

- **Test**: Click on a FAQ item to open the modal.
- **Expected**: Modal should appear with a smooth animation.
- **Verification**: 
  - The modal should have proper focus management (focus should be trapped inside).
  - Body scrolling should be disabled while modal is open.
  - Pressing ESC should close the modal.
  - Clicking outside the modal should close it.

### 5. Accessibility

- **Test**: Navigate using keyboard only (Tab, Arrow keys, Enter).
- **Expected**: All interactive elements should be focusable and usable.
- **Verification**:
  - Tab should cycle through FAQ items.
  - Arrow keys should rotate the wheel.
  - Enter should open the modal when an item is focused.
  - Screen reader should announce appropriate information.

### 6. Mobile Features

- **Test**: View on mobile device or using device emulation in browser dev tools.
- **Expected**: Layout should adapt to smaller screens.
- **Verification**:
  - Swipe gestures should rotate the wheel.
  - Text should be appropriately sized for mobile.
  - Haptic feedback should occur on interactions (if supported).

### 7. TypeScript Integration

- **Test**: Check TypeScript compilation.
- **Expected**: No TypeScript errors.
- **Verification**: Run `npm run typecheck` and verify no errors related to the FAQ component.

## Reporting Issues

If any issues are found during testing, please document:
1. The specific test case that failed
2. Expected vs. actual behavior
3. Browser/device information
4. Steps to reproduce
5. Screenshots if applicable
