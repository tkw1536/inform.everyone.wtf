import { ILegalOptions, isIURLSettableOption } from "./ILegalOptions";
import { BORDER_SIZE, DARK_THEME, LARGE_SPACE, LIGHT_THEME, SMALL_SPACE } from "./ITheme";
import { debug_fatal, debug_info, debug_warn } from "./util/debug";
import { createElement, createTextNode, insertAfter } from "./util/dom";
import { shallowClone } from "./util/misc";
import { StatsTracker } from "./StatsTracker";
import { TEXT_PREFIX, TEXT_PREFIX_COOKIES, TEXT_SUFFIX, URL_TITLE, URL_TITLE_COOKIES } from "./Text";
import { ACKEE_SERVER, STATS_ID_ATTR, URL_POLICY } from "./Config";
import { doc, win } from "./util/globals";

export class Legal {
    /**
     * Generates a new instance of Legal from a script tag. 
     * @param element <script> element to create instance from
     */
    static fromScriptTag(element: HTMLScriptElement): Legal | null  {
        debug_info("Legal.fromScriptTag", element);

        // Read the src url from the script tag and split it into options. 
        const src = element.getAttribute('src');
        if (typeof src !== 'string') {
            debug_fatal("Missing 'src' attribute of script. ");
            return null;
        }
        const srcOptions = new URL(src, location.href).search.substr(1).split(',');

        // Parse the extracted options into a proper Options Dict. 
        // We only parse non-empty options that are URL settable. 
        // In case of an empty option, we ignore the option. 
        // In case of an unknown option, we log it to the console. 
        const options: ILegalOptions = {};

        srcOptions.forEach(option => {
            if (option === '') return;
            if(!isIURLSettableOption(option)){
                debug_warn(`Option '${option}' is not known. `);
                return;
            }
            options[option] = true;
        });
        
        // When the element was loaded without a defer or async attr we should insert it right after this element. 
        if (!element.hasAttribute('defer') && !element.hasAttribute('async')) {
            options.element = element;
        }

        // When a site id was set (via a data attribute) we set the site id attribute here. 
        const statsSiteId = element.getAttribute(STATS_ID_ATTR);
        if (statsSiteId) {
            options.siteID = statsSiteId;
        }
        
        // Create the new Legal object from the provided options.
        return new Legal(options);
    }

    private o: ILegalOptions; // Options passed by the user

    // all of the elements
    private p: HTMLDivElement;
    private e: HTMLElement;
        
    /**
     * Creates a new instance of Legal
     * @param options Options to be passed
     */
    constructor(options: ILegalOptions) {
        debug_info("Legal.constructor", options);
        
        this.o = shallowClone(options);

        // Setup the theme and set the border color to transparent when needed. 
        // Because we modify theme here, we need to clone it. 
        const theme = shallowClone(this.o.dark ? DARK_THEME : LIGHT_THEME);
        if (!this.o.float) {
            theme.s = 'transparent';
        }

        // When we have an element set, turn off the fixed and no border options
        if(this.o.element) {
            this.o.float = true;
            theme.s = 'transparent';
        }

        // If the user can not opt-out disable statistics to be safe. 
        // That way you can't say the user could not opt out. 
        if (!win.localStorage && this.o.siteID) {
            debug_warn('Local Storage is not supported by this Browser. ');
            debug_warn('Assuming that the user has opted out statistics to be safe. ');
            delete this.o.siteID;
        }

        debug_info("Legal.constructor init_elements");

        this.p = createElement('div');
        this.e = createElement(this.o.element ? 'span' : 'small');
        const link = createElement('a');
        const optOutElement = createElement('span');

        debug_info("Legal.constructor init_element_tree");

        // Setup the <a> element
        link.setAttribute('href', URL_POLICY);
        link.setAttribute('target', '_blank');
        link.appendChild(
            createTextNode(
                this.o.cookies ? URL_TITLE_COOKIES : URL_TITLE)
        );

        // Setup the element itself
        this.e.appendChild(createTextNode(
            (this.o.cookies ? TEXT_PREFIX_COOKIES : '') +
            TEXT_PREFIX,
        ));
        this.e.appendChild(link);
        this.e.appendChild(createTextNode(TEXT_SUFFIX));
        this.e.appendChild(optOutElement);
        
        // finally append it to the parent
        this.p.appendChild(this.e);
        
        // create a new tracker
        if (ACKEE_SERVER !== undefined) {
            new StatsTracker(optOutElement, this.o.siteID, this.o.element ? undefined : theme.l);
        }
    
        debug_info("Legal.constructor style_elements");
        if (this.o.element) return;

        this.e.style.color = theme.f;
        link.style.color = theme.l;

        this.e.style.borderColor = theme.s;
        if (!this.o.float) {
            this.e.style.background = theme.b;
        }

        // setup the positioing
        this.e.style.display = 'block';
        
        if (!this.o.float) {
            this.p.style.position = 'fixed';
            // align to the right
            this.p.style.right = LARGE_SPACE;
            this.e.style.position = 'relative';
            this.e.style.right = LARGE_SPACE;

            // margin and padding
            this.e.style.border = BORDER_SIZE + " solid " + theme.s;
            this.e.style.padding = SMALL_SPACE;
            this.e.style.borderRadius = LARGE_SPACE;

            this.p.style.bottom = '0px';
        } else {
            // align to the right
            this.e.style.textAlign = 'right';

            // hide overflow on the parent
            this.p.style.margin = '0';
            this.p.style.padding = '0';
            this.p.style.overflow = 'none';
            this.p.style.width = '100%';

            // no margin, and proper padding
            this.e.style.margin = '0';
            this.e.style.paddingTop = SMALL_SPACE;
            this.e.style.paddingBottom = SMALL_SPACE;
            this.e.style.paddingRight = LARGE_SPACE;

            // border in the right place
            this.e.style.borderTop = BORDER_SIZE +" solid " +theme.s;
        }
    
    }

    //
    // MAIN RUN CODE
    //

    run() {
        debug_info("Legal.run");
        
        if (this.o.element) {
            insertAfter(this.e, this.o.element);
        } else {
            doc.body.appendChild(this.p)
        }
    }

}