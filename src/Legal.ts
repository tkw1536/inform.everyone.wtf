import { ILegalOptions, isIURLSettableOption } from "./ILegalOptions";
import { BORDER_SIZE, DARK_THEME, LARGE_SPACE, LIGHT_THEME, SMALL_SPACE } from "./ITheme";
import { debug_fatal, debug_info, debug_warn } from "./util/debug";
import { appendChild, createElement, createTextNode, insertAfter, missingAttribute, setAttribute } from "./util/dom";
import { shallowClone } from "./util/misc";
import { StatsTracker } from "./StatsTracker";
import { TEXT_PREFIX, TEXT_PREFIX_COOKIES, TEXT_SUFFIX, URL_TITLE_COOKIES, URL_TITLE_PREFIX, URL_TITLE_SUFFIX } from "./Text";
import { ACKEE_SERVER, STATS_ID_ATTR, URL_POLICY } from "./Config";

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
                debug_warn("Option", option, "is not known. ");
                return;
            }
            options[option] = true;
        });

        // When the element was loaded without a defer or async attr we should insert it right after this element. 
        if (missingAttribute(element, 'defer') && missingAttribute(element, 'async')) {
            debug_info("options.element", element);
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

    private o: HTMLElement | undefined;

    // all of the elements
    private p: HTMLDivElement;
    private e: HTMLElement;
        
    /**
     * Creates a new instance of Legal
     * @param options Options to be passed
     */
    constructor(options_: ILegalOptions) {
        debug_info("Legal.constructor", options_);
        
        const options = shallowClone(options_);
        this.o = options.element;

        // Setup the theme and set the border color to transparent when needed. 
        // Because we modify theme here, we need to clone it. 
        const theme = shallowClone(options.dark ? DARK_THEME : LIGHT_THEME);
        if (!options.float) {
            theme.b = 'transparent';
        }

        // When we have an element set, turn off the fixed and no border options
        if(options.element) {
            options.float = true;
            theme.b = 'transparent';
        }

        // If the user can not opt-out disable statistics to be safe. 
        // That way you can't say the user could not opt out. 
        if (!localStorage && options.siteID) {
            debug_warn('Local Storage is not supported by this Browser. ');
            debug_warn('Assuming that the user has opted out statistics to be safe. ');
            delete options.siteID;
        }

        debug_info("Legal.constructor init_elements");

        const parent = this.p = createElement('div');
        const element = this.e = createElement(options.element ? 'span' : 'small');
        const link = createElement('a');
        const optOutElement = createElement('span');

        debug_info("Legal.constructor init_element_tree");

        // Setup the <a> element
        setAttribute(link, 'href', URL_POLICY);
        setAttribute(link, 'target', '_blank');
        appendChild(link, createTextNode(URL_TITLE_PREFIX + (options.cookies ? URL_TITLE_COOKIES : "") + URL_TITLE_SUFFIX));

        // Setup the element itself
        appendChild(element, createTextNode(
            (options.cookies ? TEXT_PREFIX_COOKIES : '') +
            TEXT_PREFIX,
        ));
        appendChild(element, link);
        appendChild(element, createTextNode(TEXT_SUFFIX));
        appendChild(element, optOutElement);
        
        // finally append it to the parent
        appendChild(parent, element);
        
        // create a new tracker
        if (ACKEE_SERVER !== undefined) {
            StatsTracker(optOutElement, options.siteID, options.element ? undefined : theme.l);
        }
    
        debug_info("Legal.constructor style_elements");
        if (options.element) return;

        const elementStyle = element.style;
        const parentStyle = parent.style;

        elementStyle.color = theme.p;
        link.style.color = theme.l;

        elementStyle.borderColor = theme.b;
        if (!options.float) {
            elementStyle.background = theme.s;
        }

        // setup the positioning
        elementStyle.display = 'block';
        
        if (!options.float) {
            parentStyle.position = 'fixed';
            // align to the right
            parentStyle.right = LARGE_SPACE;
            elementStyle.position = 'relative';
            elementStyle.right = LARGE_SPACE;

            // margin and padding
            elementStyle.border = BORDER_SIZE + " solid " + theme.b;
            elementStyle.padding = SMALL_SPACE;
            elementStyle.borderRadius = LARGE_SPACE;

            parentStyle.bottom = '0px';
        } else {
            // align to the right
            elementStyle.textAlign = 'right';

            // hide overflow on the parent
            parentStyle.margin = '0';
            parentStyle.padding = '0';
            parentStyle.overflow = 'none';
            parentStyle.width = '100%';

            // no margin, and proper padding
            elementStyle.margin = '0';
            elementStyle.paddingTop = SMALL_SPACE;
            elementStyle.paddingBottom = SMALL_SPACE;
            elementStyle.paddingRight = LARGE_SPACE;

            // border in the right place
            elementStyle.borderTop = BORDER_SIZE +" solid " +theme.b;
        }
    }

    run() {
        debug_info("Legal.run");
        
        if (this.o) {
            insertAfter(this.e, this.o);
        } else {
            appendChild(document.body, this.p);
        }
    }

}