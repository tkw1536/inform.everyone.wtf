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
export function debug_info(message: string, obj1?: any, obj2?: any, obj3?: any) {
    if (process.env.NODE_ENV === "production") return;
    console.log(message, obj1, obj2);
}

/**
 * Prints a warning to the warning log
 * @param data Data to print to the debug log
 */
export function debug_warn(message: string, obj1?: any, obj2?: any) {
    if (process.env.NODE_ENV === "production") return;
    console.warn(message, obj1, obj2);
}

/**
 * Prints a fatal error to the error log
 * @param data Data tro print to the error log
 */
export function debug_fatal(message: string, obj1?: any,  obj2?: any) {
    if (process.env.NODE_ENV === "production") return;
    console.error(message, obj1, obj2);
}
