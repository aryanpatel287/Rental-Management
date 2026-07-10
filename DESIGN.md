---
version: alpha
name: Rental-Management-Design-System
description: A light-canvas property and rent management application. The system anchors on a clean light-purple app canvas with purple-mauve accented primary interactions, subtle slate-gray text, and a responsive dashboard layout. Brand character comes from the primary purple/app-bg/card pairing. Typography uses Inter (humanist sans) throughout for UI clarity.

colors:
  primary: "#714b67"
  primary-hover: "#5f3954"
  on-primary: "#ffffff"
  primary-faint: "rgba(113, 75, 103, 0.08)"
  bg-app: "#f4f2f8"
  bg-dark: "#f4f2f8"
  bg-sidebar: "#ffffff"
  bg-card: "#ffffff"
  bg-input: "#f9f8fc"
  text-main: "#1f1a37"
  text-muted: "#6a6779"
  text-primary: "{colors.primary}"
  border-color: "#e5e0f3"
  border-radius: "8px"
  border-radius-lg: "12px"
  danger: "#e65b65"
  danger-dark: "#b43140"
  danger-bg: "rgba(230, 91, 101, 0.08)"
  success: "#22c55e"
  success-bg: "rgba(34, 197, 94, 0.1)"
  success-text: "#15803d"
  warning: "#92400e"
  info: "#075985"
  border-strong: "#cbd5e1"

typography:
  heading-xl:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  heading-lg:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-md:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  heading-sm:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body-md:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  label:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  sm: "0.5rem"
  md: "0.875rem"
  lg: "1.125rem"
  xl: "1.5rem"
  pill: "999px"

spacing:
  space-1: "0.25rem"
  space-2: "0.5rem"
  space-3: "0.75rem"
  space-4: "1rem"
  space-5: "1.25rem"
  space-6: "1.5rem"
  space-8: "2rem"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    hoverBackground: "{colors.primary-hover}"
    rounded: "{colors.border-radius}"
    padding: "0.5rem 1rem"
  button-transparent:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    hoverTextColor: "{colors.text-main}"
    hoverBackground: "{colors.primary-faint}"
  text-input:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text-main}"
    rounded: "{colors.border-radius}"
    border: "1px solid {colors.border-color}"
    padding: "0.75rem 1rem"
  sidebar:
    backgroundColor: "{colors.bg-sidebar}"
    width: "260px"
    borderRight: "1px solid {colors.border-color}"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{colors.border-radius-lg}"
    border: "1px solid {colors.border-color}"
    shadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
---

## Overview

The **Rental Management Application Design System** is built on a clean, light-purple app canvas (`{colors.bg-app}` — #f4f2f8) paired with elevated white surfaces (`{colors.bg-card}` / `{colors.bg-sidebar}` — #ffffff). It uses a warm purple-mauve accent (`{colors.primary}` — #714b67) to anchor key primary actions, branding elements, and active navigation states.

Rather than generic dashboards, this UI is custom-designed for a boutique landlord managing **5 shops and 4 rooms (9 properties total)**. The design uses soft drop shadows, clean borders, and custom HSL color variables to convey a sense of modern utility, ensuring the app scales beautifully across desktop and mobile browsers.

---

## Colors

The application relies on CSS variables mapped to the `:root` pseudo-class. These color relationships establish structural depth and visual hierarchy:

### Brand & Accents
*   **Primary Purple** (`{colors.primary}` — #714b67): The defining brand accent. Applied on primary action buttons, active navigation markers, loading spinners, and links.
*   **Primary Hover** (`{colors.primary-hover}` — #5f3954): Darker variant for interactive hover and focus states.
*   **Primary Faint** (`{colors.primary-faint}` — `rgba(113, 75, 103, 0.08)`): Translucent purple background for table row selections or secondary active highlights.

### Surfaces & Backgrounds
*   **App Canvas** (`{colors.bg-app}` — #f4f2f8): The page background, providing contrast for card layouts.
*   **Sidebar** (`{colors.bg-sidebar}` — #ffffff): The structural left navigation bar. Left-anchored on desktop.
*   **Container Cards** (`{colors.bg-card}` — #ffffff): Elevated surfaces hosting the metrics grids, tables, and modal forms.
*   **Input Fields** (`{colors.bg-input}` — #f9f8fc): The standard background for text inputs and dropdown selects.

### Typography Colors
*   **Text Main** (`{colors.text-main}` — #1f1a37): Deep purple-black tone. Applied on all primary headings, tables, labels, and paragraph body copy.
*   **Text Muted** (`{colors.text-muted}` — #6a6779): Soft gray-purple tone. Used for helper text, placeholders, subtitles, and disabled labels.

### Semantic Badges
*   **Success** (`--vb-color-success` / `{colors.success-text}`): Used for paid invoice pills and resolved tickets. Background is translucent green (`{colors.success-bg}`).
*   **Danger** (`--vb-color-danger` / `{colors.danger}`): Indicates overdue invoices or warning logs. Background is translucent red (`{colors.danger-bg}`).
*   **Warning** (`--vb-color-warning` / `{colors.warning}`): Indicates pending tenant request notifications.

---

## Typography

### Font Family
The system utilizes **Inter** (`'Inter', system-ui, -apple-system, sans-serif`) throughout all interfaces. Dynamic layouts use font weights of `400` (Regular), `500` (Medium), `600` (Semi-Bold), and `700` (Bold) to construct a clear hierarchy.

### Hierarchy

| Token | Size | Weight | Line Height | Use Cases |
|---|---|---|---|---|
| `{typography.heading-xl}` | `2.25rem` | 700 | 1.15 | Main hero headers, aggregate statistics |
| `{typography.heading-lg}` | `1.8rem` | 700 | 1.2 | Section titles, login card title |
| `{typography.heading-md}` | `1.5rem` | 600 | 1.3 | Card headers, list page headings |
| `{typography.heading-sm}` | `1.15rem` | 600 | 1.3 | Property names, modal sub-headers |
| `{typography.body-md}` | `1.0rem` | 400 | 1.6 | Table rows, general labels, forms |
| `{typography.body-sm}` | `0.875rem` | 400 | 1.5 | Metadata labels, timestamp tags |
| `{typography.caption}` | `0.85rem` | 500 | 1.4 | Helper tooltips, error warnings |
| `{typography.label}` | `0.90rem` | 600 | 1.4 | Buttons, navigation sidebar items |

---

## Spacing & Layout

The spacing scale is built on relative units (`rem`) to ensure responsive rendering across standard devices:

*   `--vb-space-1`: `0.25rem` (4px) — Micro padding, button icons.
*   `--vb-space-2`: `0.5rem` (8px) — Badge padding, input-to-label gaps.
*   `--vb-space-3`: `0.75rem` (12px) — Card sub-item spacing.
*   `--vb-space-4`: `1rem` (16px) — Standard padding for inputs, list items.
*   `--vb-space-5`: `1.25rem` (20px) — Small card interiors.
*   `--vb-space-6`: `1.5rem` (24px) — Dashboard card interior padding.
*   `--vb-space-8`: `2rem` (32px) — Section margins, page header layouts.

### Structural Widths
*   **Sidebar Width**: Fixed `260px` on desktop viewports.
*   **Max Content Container**: Centered `1200px` grid in the workspace main section.
*   **Auth / Login Card Width**: Centered `440px`.
*   **Detail Modal Width**: Pinned at `550px`.

---

## Interactive States & Motion

The interface communicates state changes using smooth micro-animations:

*   **Buttons**: Hovering over `{colors.primary}` shifts to `{colors.primary-hover}` and lifts slightly (`transform: translateY(-1px)`). Pressing down translates back to `translateY(0)` with a scale factor of `0.98`.
*   **Text Inputs**: Focus shifts the border from `{colors.border-color}` to `{colors.primary}`, adding a soft glowing focus outline.
*   **Transitions**: Enforced on all interactive nodes to prevent jarring jumps:
    ```css
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    ```

---

## Components Specification

### 1. Sidebar Navigation
*   **Structure**: Fixed `260px` left panel. Contains the logo, navigation links, and the logged-in user profile block.
*   **Styles**: Background `{colors.bg-sidebar}`, right border `1px solid {colors.border-color}`.
*   **Active Link State**: Fills with `{colors.primary-faint}` and displays a vertical `3px` primary mauve bar on the left edge. Text color changes to `{colors.text-primary}`.

### 2. Metric Cards
*   **Structure**: 3-column top grid displaying:
    1.  *Total Collected*: Sum of all paid invoices.
    2.  *Total Outstanding (Arrears)*: Sum of all unpaid invoices due.
    3.  *Vacancy Tracker*: "X / 9 Properties Vacant".
*   **Styles**: Background `{colors.bg-card}`, borders `1px solid {colors.border-color}`, rounded corner `12px` (`{colors.border-radius-lg}`), shadow `var(--vb-shadow-md)`.

### 3. Dynamic Billing Timeline (The Signature Element)
*   **Structure**: Chronological list showing upcoming rent schedules.
*   **Design**: A list of properties ordered by `leases.current_due_date` ascending.
*   **Actions**:
    *   *Due in <= 3 days*: Displays a warning pill and provides a "Dispatch Email Reminder" action button.
    *   *Recorded Actions*: Landlord can click "Record Payment" directly from the timeline row to open the manual payment logging modal.

### 4. Text Input & Select Elements
*   **Structure**: Standard input wrapping a label and helper text.
*   **Styles**: Background `{colors.bg-input}`, border `1px solid {colors.border-color}`, rounded corner `8px` (`{colors.border-radius}`).
*   **Placeholder Text**: Set to `{colors.text-muted}`.

### 5. Modals (Record Payment & New Lease)
*   **Structure**: Centered overlay.
*   **Styles**: Overlay uses background `var(--vb-color-primary)` at `0.58` opacity (`--overlay-dark-58`) with backdrop blur.
*   **Container**: White surface (`{colors.bg-card}`), rounded `{colors.border-radius-lg}`, shadow `var(--vb-shadow-lg)`.

---

## Accessibility (WCAG 2.2 Compliance)

*   **Keyboard Navigation**: Active states must support `:focus-visible` with a distinct outline ring.
*   **Semantic Color Accessibility**: Never use color alone to communicate state. For example, unpaid invoices must show both a red color badge and the text label "Unpaid" or "Overdue".
*   **Contrast Safeguards**: Muted labels (`{colors.text-muted}`) must maintain a minimum contrast ratio of `4.5:1` against the white card surfaces.
