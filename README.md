# inform.everyone.wtf

This page contains my own privacy policy as well as legal nagbar script. 

## Directory Structure

- `src/` -- Typescript Library Source file
- `static/` -- Static files for the gh-pages site
- `dist/` -- Output folder, deployed to gh-pages

## Usage

Add in the header:
```html
<script async src="https://inform.everyone.wtf/legal.min.js?comma-seperated-flags"></script>
```

Where the following flags are supported:

- `dark`: Use a dark theme instead of the default light one
- `top`: Align the banner to the top of the page instead of the bottom
- `fixed`: Use fixed positioning instead of the default
- `cookies`: Show a cookies warning
- `noborder`: Don't show a border

## Deploy

- Run `yarn deploy` to push to gh-pages
