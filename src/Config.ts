/**
 * @file This file contains the global configuration read from the environment
 */

/** User-facing URL to expose */
export const URL_POLICY = process.env.URL_POLICY || "https://inform.everyone.wtf";

/** URL of the server that ACKEE runs on. Use ""  to omit. */
const ackeeServer = process.env.ACKEE_SERVER;
export const ACKEE_SERVER = ackeeServer === "" ? undefined : "https://track.everyone.wtf";
export const ACKEE_SCRIPT_URL = ACKEE_SERVER ? ACKEE_SERVER + "/tracker.js": undefined;

/** attribute to read the ackee site id from */
export const STATS_ID_ATTR = process.env.STATS_ID_ATTR || "data-site-id";

/** localStorage key to use for opt-out*/
export const STATS_OPT_OUT_KEY = process.env.STATS_OPT_OUT_KEY || "wtf.track.everyone.old.photos";
/** localStoage value to use for opt-out, anything in that key is valid */
export const STATS_OPT_OUT_VALUE = process.env.STATS_OPT_OUT_VALUE || "1";

/** Use "we" and "our" in text as opposed to "I" and "my" */
export const USE_WE_INSTEAD_OF_I = !!process.env.USE_WE_INSTEAD_OF_I;

declare const process: {
    env: {
        URL_POLICY: string | undefined,
        ACKEE_SERVER: string | undefined,
        STATS_ID_ATTR: string | undefined,
        STATS_OPT_OUT_KEY: string | undefined,
        STATS_OPT_OUT_VALUE: string | undefined,
        USE_WE_INSTEAD_OF_I: string | undefined,
    }
}