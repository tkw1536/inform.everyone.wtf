import { doc, win } from "./globals";

/** currentScript returns the current script that is being executed */
export function currentScript(): HTMLScriptElement | null {
    const script = doc.currentScript;
    if (script !== null) {
        return script as HTMLScriptElement;
    }

    const scripts = doc.getElementsByTagName("script");
    return scripts[scripts.length - 1];
}

/**
 * Insert an element right after a provided element
 * @param element New element to insert
 * @param after Element to insert after
 */
export function insertAfter(element: HTMLElement, after: HTMLElement) {
    const parentNode = after.parentElement;

    const sibling = after.nextSibling;
    if(sibling !== null) {
        parentNode?.insertBefore(element, sibling);
    } else {
        parentNode?.appendChild(element);
    }
}

/**
 * Creates a new TextNode of the given type
 * @param content Content of TextNode to create
 */
export function createTextNode(content: string) {
    return doc.createTextNode(content);
}

/**
 * Creates a new element
 * @param tagName tagName of element to create
 */
export function createElement<T extends keyof HTMLElementTagNameMap>(tagName: T): HTMLElementTagNameMap[T] {
    return doc.createElement(tagName);
}