import {
    ACKEE_SCRIPT_URL, ACKEE_SERVER, STATS_OPT_OUT_KEY, STATS_OPT_OUT_VALUE
} from "./Config";
import { TEXT_OPTOUT_RELOAD_NOW, TEXT_STATS, TEXT_STATS_OFF_PREFIX, TEXT_STATS_SUFFIX } from "./Text";
import { debug_info } from "./util/debug";
import { appendChild, createElement, createTextNode, setAttribute } from "./util/dom";


/**
 * @param element Element to store text under
 * @param siteID Site ID for script tag to build
 * @param linkColor Color to set link to. Optional. 
 */
export function StatsTracker(
    element: HTMLSpanElement,
    siteID?: string,
    linkColor?: string,
) {
    debug_info("StatsTracker.init", element, siteID, linkColor);
    if(!siteID) return;

    setStats(!getOptout())

    /**
     * set stats sets up the statistics script to to toggle on or off
    */
    function setStats(value: boolean) {
        debug_info("set StatsTracker.stats");

        setOptout(!value);
        render(!value);

        if(value) {
            load();
        } else {
            unload();
        }
    }

    let scriptElement: HTMLScriptElement | undefined; // the <script> element that implements tracking

    /**
     * load the statistics script
     */
    function load() {
        debug_info("StatsTracker.load");

        if(scriptElement || !ACKEE_SERVER || !ACKEE_SCRIPT_URL) return;

        scriptElement = createElement('script');
        setAttribute(scriptElement, 'data-ackee-server', ACKEE_SERVER);
        setAttribute(scriptElement, 'data-ackee-domain-id', siteID!);
        setAttribute(scriptElement, 'data-ackee-opts', '{"ignoreOwnVisits":false}')
        setAttribute(scriptElement, 'async', '');
        setAttribute(scriptElement, 'src', ACKEE_SCRIPT_URL);
        appendChild(document.head, scriptElement);
    }

    /**
     * Unload the statistics script
     */
    function unload() {
        debug_info("StatsTracker.unload");

        // If we didn't load the script, there is nothing to do. 
        if(scriptElement === undefined) return;

        // With the current method of inclusion it is not actually possible to unload the script.
        // We need to reload the page first. 
        // However there might be any kind of state on the current page, so we inform the user first. 
        if(!confirm(TEXT_OPTOUT_RELOAD_NOW)) return;
        location.reload();
    }

    /**
     * Render sets the stats link to update the state to toSetTo
     */
    function render(toSetTo: boolean) {
        debug_info("StatsTracker.render", toSetTo);

        // create a link to (undo) opt-out
        const link = createElement('a');
        setAttribute(link, 'href', "javascript:void");
        link.style.color = linkColor || "";
        appendChild(link, createTextNode((toSetTo ? TEXT_STATS_OFF_PREFIX : "") + TEXT_STATS));
        link.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            setStats(toSetTo);
            return false;
        });
        
        // append the text to the 'extraNode'
        element.innerHTML = "";
        appendChild(element, link);
        appendChild(element, createTextNode(TEXT_STATS_SUFFIX));
    }


    /**
     * getOptOut gets the optOutState
     */
    function getOptout(): boolean {
        const optout = localStorage.getItem(STATS_OPT_OUT_KEY) !== null;
        debug_info("get StatsTracker.optout", optout);
        return optout;
    }

    /**
     * setOptOut gets the optOutState
     * @param value 
     */
    function setOptout(value: boolean) {
        debug_info("set StatsTracker.optout", value);
        if(value) {
            localStorage.setItem(STATS_OPT_OUT_KEY, STATS_OPT_OUT_VALUE);
        } else {
            localStorage.removeItem(STATS_OPT_OUT_KEY);
        }
    }
}