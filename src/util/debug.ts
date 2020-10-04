/**
 * @file Contains functions used for debugging. 
 * These are compiled away in production mode. 
 */

declare const process: {
    env: {NODE_ENV: "production" | "development"}
}

/**
 * Prints a warning to the info log
 * @param data Data to print to the info log
 */
export function debug_info(...data: any) {
    if (process.env.NODE_ENV === "production") return;
    console.log(...data);
}

/**
 * Prints a warning to the warning log
 * @param data Data to print to the debug log
 */
export function debug_warn(...data: any) {
    if (process.env.NODE_ENV === "production") return;
    console.warn(...data);
}

/**
 * Prints a fatal error to the error log
 * @param data Data tro print to the error log
 */
export function debug_fatal(...data: any) {
    if (process.env.NODE_ENV === "production") return;
    console.error(...data);
}
