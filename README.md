# inform.everyone.wtf

This page contains my own privacy policy as well as legal script. 
The legal script inserts a link to my privacy policy and also loads the statistics script unless the user has opted out. 

## Directory Structure

- `src/` -- Typescript Library Source file
- `static/` -- Static files for the gh-pages site
- `static-test/` -- Additional static files for local gh-pages only
- `dist/` -- Output folder, deployed to gh-pages

## Build

The legal script is bundled using [parcel](https://v2.parceljs.org/) and can be configured using Environment variables. 

To run the build process use:

```
yarn build
```

Configuration is performed using environment variables, see [src/Config.ts](src/Config.ts). 
The defaults are configured for my personal domain. 

The default build supports all major browsers released in the last five years as well as IE 11. 
Note that ACKEE may not support older browser versions. 
After bundling and minifying the code, it is about 3 KB in size (without gzip).
When setting `ACKEE_SERVER=""`, it is about 2 KB. 


## Usage

Add in the header:
```html
<script defer="" src="https://inform.everyone.wtf/legal.min.js?comma-seperated-flags" data-site-id='{id-for-stats}'></script>
```

When the `data-site-id` attribute is set, includes Ackee statistics script for the provided site. 
When the `defer` attribute is omitted this script will add the element after the script tag that is including it. 

Where the following flags are supported:

- `cookies`: Show a cookies warning
- `dark`: Use a dark theme instead of the default light one
- `float`: Use `float: right` positioning instead of `position: fixed`

For legacy reasons, `async` is treated equivalent to `defer`. However this breaks in IE11. 

## Deploy

- Run `yarn deploy` to push to gh-pages

## License

All content in this repository is (c) Tom Wiesing 2020.
Code in the src/ folder is licensed under the terms of the MIT LICENSE. 