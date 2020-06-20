interface LegalNagBarOptions {
    /** Use a dark instead of a light theme */
    dark?: boolean;

    /** Align the banner to the top of the page instead of the bottom */
    top?: boolean;

    /** Use fixed positioning */
    fixed?: boolean;

    /** Set background color inline with dark / black */
    background?: boolean

    /** show the text that we use cookies */
    cookies?: boolean
}
type KnownOption = keyof LegalNagBarOptions;

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
    private static knownOptions = ['dark', 'top', 'fixed', 'background', 'cookies'] as const;


    //
    // TEXT RESOURCES
    //

    private static readonly TEXT_PREFIX_COOKIES = 'This site makes use of cookies for essential features. ';
    private static readonly TEXT_PREFIX = 'For legal reasons I must link ';

    private static readonly URL_POLICY = 'https://inform.everyone.wtf';
    private static readonly URL_TITLE = 'my Privacy Policy, Imprint and Cookie Policy';
    private static readonly URL_TITLE_COOKIES = 'my Privacy Policy and Imprint';

    private static readonly TEXT_SUFFIX = '. ';

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
        const preText = document.createTextNode(
            (this.options.cookies ? LegalNagBar.TEXT_PREFIX_COOKIES : '') +
            LegalNagBar.TEXT_PREFIX,
        );
        
        const link = document.createElement('a');
        link.style.color = 'blue';
        link.setAttribute('href', LegalNagBar.URL_POLICY);
        link.setAttribute('target', '_blank');
        link.appendChild(
            document.createTextNode(
                this.options.cookies ? LegalNagBar.URL_TITLE_COOKIES : LegalNagBar.URL_TITLE)
        );

        const postText = document.createTextNode(LegalNagBar.TEXT_SUFFIX);

        const element = document.createElement('small');
        element.appendChild(preText);
        element.appendChild(link);
        element.appendChild(postText);
        
        window.addEventListener('load', function () {
            document.body.appendChild(element);
        });


        // set styling
        if (this.options.fixed) {
            element.style.position = 'fixed';
            element.style.bottom = '0px';
            element.style.right = '5px';
        } else {
            element.style.float = 'right';
        }
        
        element.style.margin = '5px';
        
        if (this.options.dark) {
            element.style.color = 'white';
            if (this.options.background) element.style.background = 'black';
        } else {
            element.style.color = 'black';
            if (this.options.background) element.style.background = 'white';
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

