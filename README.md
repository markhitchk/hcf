# HCF — Harley's Clan Forum Custom CSS

A modern, glassmorphic theme for Flarum with cyan accents, smooth animations, and full light/dark mode support.

## 📁 Folder Structure

```
core/
├── master.css         # Main theme stylesheet (glassmorphism, animations, layout)
├── main.css           # Utilities and helpers
└── (future) drawer.css  # Forum-specific drawer/sidebar styles (when ready)

system/
└── admin.css          # Admin panel theme (isolated from forum)

addons/
└── messenger.css      # Private messages addon (optional plugin)

README.md
forum-admin-import.css  # Master import file for forum + admin panel combo
```

## 🚀 Usage

### Full Forum Theme (Recommended)
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/core/master.css" />
```

### Forum + Messenger Addon
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/core/master.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/messenger.css" />
```

### Admin Panel Only
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/system/admin.css" />
```

### Forum + Admin Panel (Correct Order)
Use `forum-admin-import.css` which ensures master.css loads before admin.css:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/forum-admin-import.css" />
```

**Why this order matters:** If messenger addon loads before master.css, it can override critical styles. The import manager ensures core styles are always established first.

## 🎨 Features

- ✨ **Glassmorphic Design** — Frosted glass effects with backdrop blur
- 🎭 **Full Light/Dark Mode** — Automatically adapts to forum theme
- 💫 **Smooth Animations** — Entrance effects, transitions, and hover states
- ♿ **Accessibility** — Respects `prefers-reduced-motion` preference
- 📱 **Responsive** — Optimized for desktop, tablet, and mobile
- 🔧 **Modular** — Easy to customize or extend

## 📝 File Descriptions

### Core Files
- **master.css** — Main theme; includes header, alerts, modals, buttons, profile dropdown, login/signup, file cards, and responsive design
- **main.css** — Utility styles and helpers (planned expansion)

### System (Admin)
- **admin.css** — Flarum admin panel theme; scoped to admin-only selectors to avoid leaking onto the forum

### Addons
- **messenger.css** — Private messages styling; optional plugin that enhances the messaging interface

## 🛠️ Customization

All colors use CSS variables defined in `:root` for easy customization:

```css
:root {
  --cyan: #00ffff;
  --cyan-soft: rgba(0, 255, 255, 0.35);
  --glass-bg: rgba(25, 25, 25, 0.9);
  --text: #e8e8e8;
  --accent: #00ffff;
  --border: rgba(255, 255, 255, 0.12);
  --shadow: rgba(0, 0, 0, 0.35);
  --btn-text: #1a1a1a;
}
```

Override these in your own CSS or create a custom variant.

## 📋 Browser Support

- Chrome/Edge 94+
- Firefox 93+
- Safari 15+
- Mobile browsers with backdrop-filter support

Fallbacks provided for:
- `color-mix()` (older browsers use fallback shadow values)
- `aspect-ratio` (padding-bottom fallback for flip phones)
- `:has()` selector (plain `:hover` fallback)

## 🤝 Contributing

Bugs, suggestions, or improvements? Open an issue or submit a PR.

---

**Version:** 4.6  
**Author:** HarleyTG  
**Last Updated:** 2026-07-23 (UTC)
