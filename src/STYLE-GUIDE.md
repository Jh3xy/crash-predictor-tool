
# Oracle - Design Style Guide 🚀

This document contains the design tokens and specifications for the **Oracle Coming Soon Landing Page**.

---

## 🎨 Color Palette

### 🌙 Dark Mode (Primary)
* **Background Gradient:** `hsla(217, 39%, 11%, 1)` to `hsla(217, 39%, 3%, 1)`
* **Primary Text:** `hsla(206, 24%, 96%, 1)` (White-ish)
* **Secondary Text:** `hsla(210, 10%, 65%, 1)` (Light Gray)
* **Accent Color:** `hsla(169, 74%, 39%, 1)` (Teal)
* **Accent Glow:** `hsla(169, 74%, 39%, 0.4)`

### ☀️ Light Mode (Suggested)
* **Background Gradient:** `hsla(0, 0%, 100%, 1)` to `hsla(210, 20%, 98%, 1)`
* **Primary Text:** `hsla(217, 39%, 11%, 1)` (Dark Blue)
* **Accent Color:** `hsla(169, 74%, 30%, 1)` (Darker Teal)

---

## 🔡 Typography

| Element | Font Family | Size (Responsive) | Weight |
| :--- | :--- | :--- | :--- |
| **H1 (Logo)** | Google Sans | `clamp(2.5rem, 8vw, 6rem)` | 700 (Bold) |
| **H2 (Subtitle)** | Google Sans | `clamp(1.2rem, 3vw, 2.2rem)` | 400 (Regular) |
| **Countdown** | Google Sans Code | `clamp(2rem, 6vw, 4rem)` | 700 (Bold) |
| **Body Text** | Google Sans | `1.125rem` | 400 (Regular) |
| **Footer** | Google Sans | `0.9rem` | 400 (Regular) |

---

## 📏 Spacing & Layout

* **Base Unit:** `0.5rem` (8px)
* **Container Padding:** `2rem` (var-md)
* **Section Gaps:** `2rem`
* **Element Gaps:** `1rem`

---

## ✨ Effects & UI Elements

### 🔘 Buttons (Join Beta)
* **Radius:** Pill shape (`9999px`)
* **Padding:** `0.8rem` top/bottom, `2rem` left/right
* **Transition:** `0.3s ease-in-out`
* **Hover Effect:** Scale up to `1.05` + Teal Glow Shadow

### 🌑 Shadows
* **Button Glow:** `0 0 15px hsla(169, 74%, 39%, 0.4)`
* **Text Glow:** `0 0 5px hsla(169, 74%, 39%, 0.4)`
### 🌑 Icons
* **Chart Icon:** `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12V20H6V12H4Z" fill="currentColor"/>
    <path d="M10 8V20H12V8H10Z" fill="currentColor"/>
    <path d="M16 4V20H18V4H16Z" fill="currentColor"/>
</svg>`


---

## 💻 CSS Variables (Quick Copy)

```css
:root {
  /* --- Color Palette (Dark Mode) --- */
  --color-bg-dark-start: hsla(217, 39%, 11%, 1); /* #0f172a */
  --color-bg-dark-end: hsla(217, 39%, 3%, 1);    /* #020617 */
  --color-text-dark-primary: hsla(206, 24%, 96%, 1); /* #f1f5f9 (White-ish) */
  --color-text-dark-secondary: hsla(210, 10%, 65%, 1); /* Light Gray for subtitle */
  --color-accent-dark: hsla(169, 74%, 39%, 1);   /* #1abc9c (Teal) */
  --color-glow-dark: hsla(169, 74%, 39%, 0.4);   /* rgba(26,188,156,0.4) */
  --color-button-dark-bg: var(--color-accent-dark);
  --color-button-dark-text: var(--color-text-dark-primary);
  --color-footer-dark-text: hsla(210, 8%, 50%, 1); /* Gray for footer */
  --color-hamburger-dark: var(--color-text-dark-primary); /* Hamburger icon color */

  /* --- Color Palette (Light Mode - Inferred/Suggested) --- */
  --color-bg-light-start: hsla(0, 0%, 100%, 1); /* White */
  --color-bg-light-end: hsla(210, 20%, 98%, 1);  /* Very light blue-gray */
  --color-text-light-primary: hsla(217, 39%, 11%, 1); /* Dark blue for primary text */
  --color-text-light-secondary: hsla(210, 10%, 40%, 1); /* Medium gray */
  --color-accent-light: hsla(169, 74%, 30%, 1);   /* Slightly darker teal for contrast */
  --color-glow-light: hsla(169, 74%, 30%, 0.2);   /* Lighter glow */
  --color-button-light-bg: var(--color-accent-light);
  --color-button-light-text: var(--color-bg-light-start);
  --color-footer-light-text: hsla(210, 8%, 30%, 1);
  --color-hamburger-light: var(--color-text-light-primary);

  /* --- Typography --- */
  --font-family-primary: 'Google Sans', sans-serif;
  --font-family-secondary: 'Google Sans Code', monospace; /* For countdown timer */
  --font-weight-regular: 400;
  --font-weight-bold: 700;

  --font-size-h1: clamp(2.5rem, 8vw, 6rem);    /* Oracle */
  --font-size-h2: clamp(1.2rem, 3vw, 2.2rem); /* AI-Powered Crash Prediction Analytics */
  --font-size-coming-soon: clamp(1.5rem, 5vw, 3rem); /* Coming Soon */
  --font-size-body: clamp(0.9rem, 2vw, 1.125rem);
  --font-size-small: clamp(0.75rem, 1.5vw, 0.9rem); /* Footer text */
  --font-size-countdown: clamp(2rem, 6vw, 4rem); /* Countdown timer */

  /* --- Spacing & Layout --- */
  --spacing-unit: 0.5rem; /* Base unit for modular scaling */
  --spacing-xxs: calc(var(--spacing-unit) * 0.5); /* 0.25rem */
  --spacing-xs: var(--spacing-unit);             /* 0.5rem */
  --spacing-sm: calc(var(--spacing-unit) * 2);   /* 1rem */
  --spacing-md: calc(var(--spacing-unit) * 4);   /* 2rem */
  --spacing-lg: calc(var(--spacing-unit) * 6);   /* 3rem */
  --spacing-xl: calc(var(--spacing-unit) * 8);   /* 4rem */
  --spacing-xxl: calc(var(--spacing-unit) * 12);  /* 6rem */

  --container-padding: var(--spacing-md);
  --element-gap-sm: var(--spacing-sm);
  --element-gap-md: var(--spacing-md);
  --header-height: 4rem; /* For fixed header/menu */