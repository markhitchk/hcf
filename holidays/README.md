# Harley's Clan Forum Holiday Banner

Automatic holiday banners designed to match the existing birthday banner in `header/header.html`.

## Included holidays

New Year's Day, Martin Luther King Jr. Day, Valentine's Day, Presidents' Day, St. Patrick's Day, Easter, Mother's Day, Memorial Day, Juneteenth, Father's Day, Independence Day, Labor Day, Halloween, Veterans Day, Thanksgiving, Christmas Eve, Christmas Day, and New Year's Eve.

Fixed and moving holiday dates are calculated automatically using `America/Los_Angeles` time.

## Install

Add this immediately before `</body>` in `header/header.html`:

```html
<script src="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/holidays/holidays.js"></script>
```

The script creates the banner, styles, close button, animations, and page effects. Settings are loaded from `holidays.json`.

## Preview and testing

Add a holiday ID to the header URL:

```text
?hcHoliday=halloween
?hcHoliday=thanksgiving
?hcHoliday=christmas-day
?hcHoliday=new-years-day
```

Use `?hcHoliday=off` to hide it while testing.

Browser-console commands:

```js
HCHolidays.list();
HCHolidays.force("halloween");
HCHolidays.clearForce();
HCHolidays.refresh();
```

## Custom annual holidays

Add entries to `customHolidays` in `holidays.json` using this format:

```json
{
  "id": "forum-anniversary",
  "label": "Forum Anniversary",
  "title": "Happy Harley's Clan Forum Anniversary! 🎉",
  "subtitle": "Celebrating another year of our community",
  "icon": "🎂",
  "month": 1,
  "day": 15,
  "gradient": ["#083b4d", "#166b87", "#7a35d6", "#d45c98"],
  "particles": ["✦", "★", "●", "◆"]
}
```

Closing a banner hides it for the current browser session. When the birthday banner is also visible, holiday page-wide particles are suppressed to prevent duplicate effects.
