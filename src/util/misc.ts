/**
 * Makes a shallow clone of an object, that is it copies each own property of original into a new object clone. 
 * @param original Object to clone. 
 */
export function shallowClone<T extends Record<string, any>>(original: T): T {
    const clone: {[key: string]: any} = {};
    for (const key in original) {
        if (!original.hasOwnProperty(key)) continue;
        clone[key] = original[key];
    }
    return clone as T;
}

