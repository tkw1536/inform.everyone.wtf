import { ILegalOptions } from "./ILegalOptions";
import { BORDER_SIZE, DARK_THEME, LARGE_SPACE, LIGHT_THEME, SMALL_SPACE } from "./ITheme";
import { debug_info, debug_warn } from "./util/debug";
import { appendChild, createElement, createTextNode, insertAfter, missingAttribute, setAttribute } from "./util/dom";
import { shallowClone } from "./util/misc";
import { StatsTracker } from "./StatsTracker";
import { TEXT_PREFIX, TEXT_PREFIX_COOKIES, TEXT_SUFFIX, URL_TITLE_COOKIES, URL_TITLE_PREFIX, URL_TITLE_SUFFIX } from "./Text";
import { ACKEE_SERVER, URL_POLICY } from "./Config";

export function Legal(options: ILegalOptions) {
    debug_info("Legal.constructor", options);

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

    const parentElement = createElement('div');
    const element = createElement(options.element ? 'span' : 'small');
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
    appendChild(parentElement, element);
    
    // create a new tracker
    if (ACKEE_SERVER !== undefined) {
        StatsTracker(optOutElement, options.siteID, options.element ? undefined : theme.l);
    }

    if (!options.element) {
        debug_info("Legal.constructor style_elements");

        const elementStyle = element.style;
        const parentStyle = parentElement.style;

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

    debug_info("Legal.run");  
    if (options.element) {
        insertAfter(element!, options.element);
    } else {
        appendChild(document.body, parentElement!);
    }
}