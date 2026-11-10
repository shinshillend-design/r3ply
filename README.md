# R3PLY

Agency site for https://r3ply.xyz. Plain HTML, CSS and JavaScript, no build step.

## Files

- `index.html` - the homepage (hero, client results, process, what's included, booking, FAQ)
- `reply-guys/index.html` - reply guy application page (Tally form)
- `assets/site.css` - all shared styles
- `assets/site.js` - all behaviour (case explorer, screenshot viewer, booking calendar loader)
- `assets/` images - original X analytics screenshots used as proof
- `og-image.png`, favicons, `apple-touch-icon.png` - share image and icons

## Run locally

Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

then visit http://localhost:8000

## Editing the client results

Each case is one `<article class="case">` block in `index.html`, with a matching tab in
`<div class="case-tabs">` and a line on the hero statement receipt. Numbers appear in up to
three places (hero line, tab, receipt), so update all of them together. The hero total is the
sum of the six hero lines; the arithmetic is in a comment next to it.
