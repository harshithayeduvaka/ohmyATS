

# Add Logo to Website

## Summary
Copy the uploaded logo image into the project and display it in three key locations: the sidebar header, the mobile header bar, and the dashboard page.

## Steps

1. **Copy logo asset** — Copy `user-uploads://2026-04-01_21-13-28.png` to `src/assets/logo.png`

2. **Update Sidebar Header (`src/components/AppSidebar.tsx`)**
   - Import the logo: `import logo from "@/assets/logo.png"`
   - Replace the text-only branding (lines 71-77) with an `<img>` tag
   - When collapsed: show a small ~28px version of the logo
   - When expanded: show the logo at ~120px width

3. **Update Mobile Header (`src/components/AppLayout.tsx`)**
   - Import the logo and replace the `<span>oh my ATS</span>` text (line 12) with an `<img>` of the logo (~80px wide, visible on `md:hidden`)

4. **Update Dashboard Hero (`src/pages/Dashboard.tsx`)**
   - Optionally display the logo above the headline for brand reinforcement (~140px wide)

## Technical Details
- Logo imported as ES6 module from `src/assets/` for proper Vite bundling
- Uses `object-contain` for consistent rendering across light/dark themes
- For dark mode, apply `dark:invert` class since the logo is black-on-white line art

