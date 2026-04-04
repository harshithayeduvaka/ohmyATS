

## Plan: Replace Canva Link with Uploaded Logo Asset

The uploaded images (`oh_my_ATS_1.png` and `oh_my_ATS-3.png`) are the same logo with the megaphone + "OH MY ATS" text -- a proper transparent PNG. The sidebar and dashboard currently point to a broken Canva link instead of the local asset. AppLayout and About already use the local import correctly.

### Steps

1. **Copy uploaded logo to `src/assets/logo.png`**
   - Use `oh_my_ATS_1.png` (or `oh_my_ATS-3.png`, they appear identical) to replace `src/assets/logo.png`
   - This is the single source of truth -- AppLayout and About already import from this path

2. **Update `src/components/AppSidebar.tsx` (line 73)**
   - Change `src="https://canva.link/p5urf85754goya5"` back to `src={logo}` (the import on line 2 already exists)
   - Add `bg-transparent` to ensure no background leaks

3. **Update `src/pages/Dashboard.tsx` (line 24)**
   - Import logo: `import logoImg from "@/assets/logo.png"`
   - Change `src="https://canva.link/p5urf85754goya5"` to `src={logoImg}`
   - Add `bg-transparent` to className

All four logo locations (sidebar, dashboard, mobile header, about page) will then use the same local transparent PNG asset with `object-contain`, `bg-transparent`, and `dark:invert`.

