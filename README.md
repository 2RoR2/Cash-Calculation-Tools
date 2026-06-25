# Cash Count Receipt System

A modern web-based cash receipt application with the following features:

## Features

- **Cash Count Receipt** - Track cash denominations and calculate totals
- **Opening Cash Calculator** - Calculate opening cash targets and denomination breakdowns
- **Save & Load** - Save receipt history locally with search functionality
- **Export Options** - Save as PDF or PNG image
- **Smart Date Handling** - Automatic Kuching (UTC+8) timezone date
- **Professional Orange Theme** - Clean, modern receipt design
- **Responsive Design** - Works on desktop and mobile devices

## Usage

1. Enter date (auto-populated with today's date)
2. Add quantities for each denomination
3. Add optional comments/notes (shown with star icon)
4. Use Opening Cash Calculator to plan cash withdrawal
5. Save receipt to history or export as PDF/Image

## Deployment

Deployed on Vercel: [Your URL here]

## Local Usage

Simply open `Cash_Count_Receipt_App.html` in a web browser.

**Note:** For full localStorage functionality, use a local web server:
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- jsPDF (for PDF export)
- html2canvas (for image export)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
