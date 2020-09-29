import {
    ACKEE_SCRIPT_URL, ACKEE_SERVER, STATS_OPT_OUT_KEY, STATS_OPT_OUT_VALUE
} from "./Config";
import { TEXT_OPTOUT_RELOAD_NOW, TEXT_STATS, TEXT_STATS_OFF_PREFIX, TEXT_STATS_SUFFIX } from "./Text";
import { debug_info } from "./util/debug";
import { appendChild, createElement, createTextNode, setAttribute } from "./util/dom";


/**
 * Creates a new StatsTrack instance
 */
export class StatsTracker {
    /**
     * @param e Element to store text under
     * @param i Site ID for script tag to build
     * @param t Color to set link to. Optional. 
     */
    constructor(
        private readonly e: HTMLSpanElement,
        private readonly i?: string,
        private readonly t?: string,

    ) {
        debug_info("StatsTracker.constructor", e, i, t);

        if (!this.i) return;

        this.stats = !this.optout;
    }

    /**
     * set stats sets up the statistics script to to toggle on or off
    */
    private set stats(value: boolean) {
        debug_info("set StatsTracker.stats");

        this.optout = !value;
        this.render(!value);

        if(value) {
            this.load();
        } else {
            this.unload();
        }
    }

    private s?: HTMLScriptElement; // the <script> element that implements tracking

    /**
     * load the statistics script
     */
    private load() {
        debug_info("StatsTracker.load");
    
        if(this.s || !ACKEE_SERVER || !ACKEE_SCRIPT_URL) return;

        const scriptElement = this.s = createElement('script');
        setAttribute(scriptElement, 'data-ackee-server', ACKEE_SERVER);
        setAttribute(scriptElement, 'data-ackee-domain-id', this.i!);
        setAttribute(scriptElement, 'async', '');
        setAttribute(scriptElement, 'src', ACKEE_SCRIPT_URL);
        appendChild(document.head, scriptElement);
    }

    /**
     * Unload the statistics script
     */
    private unload() {
        debug_info("StatsTracker.unload");

        // If we didn't load the script, there is nothing to do. 
        if(this.s === undefined) return;

        // With the current method of inclusion it is not actually possible to unload the script.
        // We need to reload the page first. 
        // However there might be any kind of state on the current page, so we inform the user first. 
        if(!confirm(TEXT_OPTOUT_RELOAD_NOW)) return;
        location.reload()
    }

    /**
     * Render sets the stats link to update the state to toSetTo
     */
    private render(toSetTo: boolean) {
        debug_info("StatsTracker.render", toSetTo);

        // create a link to (undo) opt-out
        const link = createElement('a');
        setAttribute(link, 'href', "javascript:void");
        link.style.color = this.t || "";
        appendChild(link, createTextNode((toSetTo ? TEXT_STATS_OFF_PREFIX : "") + TEXT_STATS));
        link.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            this.stats = toSetTo;
            return false;
        });
        
        // append the text to the 'extraNode'
        const element = this.e;
        element.innerHTML = "";
        appendChild(element, link);
        appendChild(element, createTextNode(TEXT_STATS_SUFFIX));
    }


    /**
     * getOptOut gets the optOutState
     */
    private get optout(): boolean {
        const optout = localStorage.getItem(STATS_OPT_OUT_KEY) !== null;
        debug_info("get StatsTracker.optout", optout);
        return optout;
    }

    /**
     * setOptOut gets the optOutState
     * @param value 
     */
    private set optout(value: boolean) {
        debug_info("set StatsTracker.optout", value);
        if(value) {
            localStorage.setItem(STATS_OPT_OUT_KEY, STATS_OPT_OUT_VALUE);
        } else {
            localStorage.removeItem(STATS_OPT_OUT_KEY);
        }
    }

}