# iPersonal - Development Rules

## Project Context

This project is called **iPersonal**.

The application was initially designed in Figma and presented to stakeholders.

The visual design has already been approved.

Because of this, preserving the design is more important than redesigning or refactoring the UI.

The goal is to transform the current prototype into a fully functional mobile application.

---

# ABSOLUTE RULE #1

DO NOT CHANGE THE DESIGN.

DO NOT:

- Change colors
- Change spacing
- Change typography
- Change layout structure
- Change card hierarchy
- Change navigation flow
- Change icons
- Change component positions
- Add visual improvements
- Modernize the design
- Create alternative layouts

The UI must remain visually identical to the approved Figma prototype.

Only functional implementation is allowed.

If a component must be modified, preserve the exact visual appearance.

---

# Technology Migration

The original project may contain:

- React Web
- Vite
- HTML
- CSS
- Tailwind CSS

Whenever code is generated or refactored:

Convert everything to:

- React Native
- Expo
- TypeScript
- NativeWind

Never generate:

- React DOM
- HTML tags
- CSS files
- Vite-specific code

---

# Allowed Components

Replace web components with React Native equivalents.

Examples:

HTML:

```html
<div>
<span>
<button>
<img>
<input>