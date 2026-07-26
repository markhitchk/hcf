# HCF — Harley's Clan Forum Custom CSS

A modern, glassmorphic theme for Flarum with cyan accents, smooth animations, and full light/dark mode support.

This repo powers the custom styling for **[Harley's Clan Forum](https://forum.harleytg.com/)** (also available at [harleysclan.freeflaurm.com](https://harleysclan.freeflaurm.com/)).

## 📁 Folder Structure

```
core/
└── master.css                          # Main theme stylesheet (glassmorphism, animations, layout)

system/
└── admin.css                           # Admin panel theme (isolated from forum)

addons/
├── messenger.css                       # Private messages addon (optional plugin)
└── notifications-messenger-style.css   # Messenger-style notifications dropdown

footer/
└── footer.html                         # Custom forum footer (identity, IP, clocks)

FoF HTML Errors/
├── 403.html                            # Forbidden error page
├── 404.html                            # Not Found error page
├── 500.html                            # Internal Server Error page
└── 503.html                            # Service Unavailable / maintenance page

README.md
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

### Messenger-Style Notifications
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/addons/notifications-messenger-style.css" />
```

### Admin Panel Only
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/system/admin.css" />
```

**Load order matters:** always load `core/master.css` first, then addons — if an addon loads before master.css, it can override critical styles.

### Footer
Paste the contents of `footer/footer.html` into the forum's custom footer (Administration → Appearance → Custom Footer).

### Error Pages
The pages in `FoF HTML Errors/` are standalone HTML error pages (403, 404, 500, 503) for the FoF error pages setup — serve each file for its matching HTTP status code.

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

### System (Admin)
- **admin.css** — Flarum admin panel theme; scoped to admin-only selectors to avoid leaking onto the forum

### Addons
- **messenger.css** — Private messages styling; optional plugin that enhances the messaging interface
- **notifications-messenger-style.css** — Styles the notifications dropdown to match the messenger look

### Footer
- **footer.html** — Harley's Clan footer with back-to-top button, brand block, and a terminal-style panel (identity, click-to-reveal IP, UTC/local clocks); all data processed locally in the browser

### FoF HTML Errors
- **403.html / 404.html / 500.html / 503.html** — Standalone branded error pages with animated logo and Back to Home / Get Support buttons

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
**Last Updated:** 2026-07-26 (UTC)
