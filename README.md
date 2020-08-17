# inform.everyone.wtf

This page contains my own privacy policy as well as legal nagbar script. 

## Directory Structure

- `src/` -- Typescript Library Source file
- `static/` -- Static files for the gh-pages site
- `dist/` -- Output folder, deployed to gh-pages

## Usage

Add in the header:
```html
<script async="" src="https://inform.everyone.wtf/legal.min.js?comma-seperated-flags" data-site-id='{id-for-stats}'></script>
```

When the `data-site-id` attribute is set, includes Ackee statistics script for the provided site. 
When the async attribute is omitted this script will add the element after the script tag that is including it. 

Where the following flags are supported:

- `dark`: Use a dark theme instead of the default light one
- `top`: Align the banner to the top of the page instead of the bottom
- `fixed`: Use fixed positioning instead of the default
- `cookies`: Show a cookies warning
- `noborder`: Don't show a border
- `small`: Use a `small` instead of a `p`
- `transparent`: Don't add a background, even in fixed positioning. 
## Deploy

- Run `yarn deploy` to push to gh-pages
