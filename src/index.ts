import { STATS_ID_ATTR } from "./Config";
import { ILegalOptions, isIURLSettableOption } from "./ILegalOptions";
import { LegalLegacy } from "./Legal";
import { debug_fatal, debug_info, debug_warn } from "./util/debug";
import { currentScript, missingAttribute } from "./util/dom";

const element = currentScript();
debug_info("Legal.fromScriptTag", element);

let src: string | null;
if (element && typeof (src = element.getAttribute('src')) === 'string') {
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
    (new LegalLegacy(options)).run();
} else {
    debug_fatal("Missing 'src' attribute of script. ");
}