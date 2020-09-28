export interface ILegalOptions {
    /** color options */
    dark?: boolean; // use a dark theme instead of a light one

    /** position options */
    float?: boolean; // use 'float:right' instead of fixed positioning
    element?: HTMLElement; // append *after* this element, instead of dynamically creating a parent
                           // when set, all of the other styling options (dark, small, noborder, etc) are ignored. 

    /** content options */
    cookies?: boolean; // show the text that we're using cookies
    siteID?: string; // initialize stats code with this site-id
}

const urlOptions = ['cookies', 'dark', 'float'] as const;
export type IURLSettableOption = typeof urlOptions[number];

/**
 * Checks if a string is of type URLSettableOption
 */
export function isIURLSettableOption(option: string): option is IURLSettableOption {
    return urlOptions.indexOf(option as IURLSettableOption) !== -1;
}
