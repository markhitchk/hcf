# Seasonal celebrations

Birthday and holiday data and scripts for Harley's Clan Forum.

## Files

- `birthdays.json` — public month/day birthday records
- `holidays.js` — automatic holiday banner system
- `holidays.json` — holiday settings and custom holidays
- `install-snippet.html` — script tag for the holiday system

## Install holiday banners

```html
<script src="https://cdn.jsdelivr.net/gh/markhitchk/hcf@main/v1.x/add-ons/seasonal/holidays.js"></script>
```

The system uses the `America/Los_Angeles` timezone and loads its settings from `holidays.json` in this folder.

## Testing

Production uses real holiday dates only. Forced holiday testing is allowed on localhost, or on the production forum only when `hcDebug=1` is present.

```text
https://forum.harleytg.com/?hcDebug=1&hcHoliday=all
https://forum.harleytg.com/?hcDebug=1&hcHoliday=all&hcSpeed=5000
```
