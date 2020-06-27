interface LegalNagBarOptions {
    /** Use a dark instead of a light theme */
    dark?: boolean;

    /** Align the banner to the top of the page instead of the bottom */
    top?: boolean;

    /** Use fixed positioning */
    fixed?: boolean;

    /** don't show a border */
    noborder?: boolean;

    /** use a small instead of a p */
    small?: boolean;

    /** show the text that we use cookies */
    cookies?: boolean
}
type KnownOption = keyof LegalNagBarOptions;


interface Theme {
    color: string;
    background: string;
    border: string;
    link: string; 
}

const LIGHT_THEME: Theme = {
    color: 'black',
    background: 'white',
    border: 'black',
    link: 'blue',
}

const DARK_THEME: Theme = {
    color: 'white',
    background: 'black',
    border: 'white',
    link: 'blue',
}

function onDOMReady(callback: () => void) {
    const state = document.readyState;
    if (state === "complete" || state === "interactive") {
        callback();
        return;
    }
    window.addEventListener('DOMContentLoaded', callback);
}


class LegalNagBar {
    private options: LegalNagBarOptions;
    
    /**
     * Creates a new LegalNagBarOptions
     * @param options Options to be passed
     */
    constructor(options: LegalNagBarOptions) {
        this.options = options;
    }

    // known static options
    private static knownOptions = ['dark', 'top', 'fixed', 'cookies', 'noborder', 'small'] as const;


    //
    // TEXT RESOURCES
    //

    private static readonly TEXT_PREFIX_COOKIES = 'This site makes use of cookies for essential features. ';
    private static readonly TEXT_PREFIX = 'For legal reasons I must link ';

    private static readonly URL_POLICY = 'https://inform.everyone.wtf';
    private static readonly URL_TITLE = 'my Privacy Policy and Imprint';
    private static readonly URL_TITLE_COOKIES = 'my Privacy Policy, Imprint and Cookie Policy';

    private static readonly TEXT_SUFFIX = '. ';


    //
    // STYLE SIZES
    //
    private static readonly BORDER_SIZE = '1px'
    private static readonly SMALL_SPACE = '5px'
    private static readonly LARGE_SPACE = '10px'

    /**
     * Generates a new instance of LegalNagBar from a script tag. 
     * @param element <script> element to create instance from
     */
    static fromScriptTag(element: HTMLScriptElement): LegalNagBar | null  {

        // read the 'src=' part of the url
        const src = element.getAttribute('src');
        if (typeof src !== 'string') {
            console.error('Invalid script tag: Must be using \'src\' attribute and not be inline. ');
            return null;
        }

        // get the search part of the url
        const searchURL = new URL(src, location.href).search.substr(1);

        // parse all the options
        const options: LegalNagBarOptions = {};
        if (searchURL !== '') {
            searchURL.split(',').forEach( option => {
                if(this.knownOptions.indexOf(option as any) !== -1) {
                    options[option as KnownOption] = true;
                } else {
                    console.warn(`Option '${option}' is not known. `);
                }
            });
        }

        // and make an instance
        return new LegalNagBar(options);
    }

    run() {
        // create the element structure

        const preText = document.createTextNode(
            (this.options.cookies ? LegalNagBar.TEXT_PREFIX_COOKIES : '') +
            LegalNagBar.TEXT_PREFIX,
        );
        
        const link = document.createElement('a');
        link.setAttribute('href', LegalNagBar.URL_POLICY);
        link.setAttribute('target', '_blank');
        link.appendChild(
            document.createTextNode(
                this.options.cookies ? LegalNagBar.URL_TITLE_COOKIES : LegalNagBar.URL_TITLE)
        );

        const postText = document.createTextNode(LegalNagBar.TEXT_SUFFIX);
        
        // add the element to the page
        const element = document.createElement(this.options.small ? 'small' : 'p');
        element.appendChild(preText);
        element.appendChild(link);
        element.appendChild(postText);

        const parent = document.createElement('div');
        parent.appendChild(element);

        onDOMReady(() => {
            if(this.options.top) {
                document.body.prepend(parent);
            } else {
                document.body.appendChild(parent)
            }
        });
        
        // setup the theme
        const theme = this.options.dark ? DARK_THEME : LIGHT_THEME;
        if (this.options.noborder) {
            theme.border = 'transparent';
        }
        
        element.style.color = theme.color;
        link.style.color = theme.link;
        element.style.borderColor = theme.border;
        if (this.options.fixed) {
            element.style.background = theme.background;
        }
        

        // setup the positioing
        element.style.display = 'block';
        
        if (this.options.fixed) {
            parent.style.position = 'fixed';
            // align to the right
            parent.style.right = LegalNagBar.LARGE_SPACE;
            element.style.position = 'relative';
            element.style.right = LegalNagBar.LARGE_SPACE;

            // margin and padding
            element.style.border = `${LegalNagBar.BORDER_SIZE} solid ${theme.border}`;
            element.style.padding = LegalNagBar.SMALL_SPACE;
            element.style.borderRadius = LegalNagBar.LARGE_SPACE;

            if (this.options.top) {
                parent.style.top = '0px';
            } else {
                parent.style.bottom = '0px';
            }
        } else {

            // align to the right
            element.style.textAlign = 'right';

            // hide overflow on the parent
            parent.style.margin = '0';
            parent.style.padding = '0';
            parent.style.overflow = 'none';
            parent.style.width = '100%';

            // no margin, and proper padding
            element.style.margin = '0';
            element.style.paddingTop = LegalNagBar.SMALL_SPACE;
            element.style.paddingBottom = LegalNagBar.SMALL_SPACE;
            element.style.paddingRight = LegalNagBar.LARGE_SPACE;

            // border in the right place
            if (this.options.top) {
                element.style.borderBottom = `${LegalNagBar.BORDER_SIZE} solid ${theme.border}`;
            } else {
                element.style.borderTop = `${LegalNagBar.BORDER_SIZE} solid ${theme.border}`;
            }
        }
        
    }
}

// read the current script
const script = document.currentScript;
if (script === null) {
    console.error('Something went wrong loading legal-nagbar. ');
    console.error('This script should be included inside a');
} else {
    (window as any).legal = LegalNagBar.fromScriptTag(script as HTMLScriptElement);
    (window as any).legal.run();
}

