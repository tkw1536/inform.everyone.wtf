/** currentScript returns the current script that is being executed */
export function currentScript(): HTMLScriptElement | null {
    const script = document.currentScript;
    if (script) {
        return script as HTMLScriptElement;
    }

    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
}

/**
 * Insert an element right after a provided element
 * @param element New element to insert
 * @param after Element to insert after
 */
export function insertAfter(element: HTMLElement, after: HTMLElement) {
    const parentNode = after.parentElement;
    if (!parentNode) return;

    const sibling = after.nextSibling;
    if(!sibling) {
        parentNode.insertBefore(element, sibling);
    } else {
        appendChild(parentNode, element);
    }
}

export const createTextNode = document.createTextNode.bind(document);
export const createElement = document.createElement.bind(document);

/**
 * Set an attribute on an element
 * @param element Element to modify
 * @param attribute Attribute to set
 * @param value Value to set it to 
 */
export function setAttribute(element: HTMLElement, attribute: string, value: string) {
    element.setAttribute(attribute, value);
}

export function missingAttribute(element: HTMLElement, attribute: string): boolean {
    return !element.hasAttribute(attribute);
}

/**
 * Appends a child to a node
 * @param node Node to append child to
 * @param newChild New Child to append
 */
export function appendChild(node: Node, newChild: Node) {
    node.appendChild(newChild)
}