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

/**
 * Creates a new TextNode of the given type
 * @param content Content of TextNode to create
 */
export function createTextNode(content: string) {
    return document.createTextNode(content);
}

/**
 * Creates a new element
 * @param tagName tagName of element to create
 */
export function createElement<T extends keyof HTMLElementTagNameMap>(tagName: T): HTMLElementTagNameMap[T] {
    return document.createElement(tagName);
}

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
 * Appens a child to a node
 * @param node Node to append child to
 * @param newChild New Child to append
 */
export function appendChild(node: Node, newChild: Node) {
    node.appendChild(newChild)
}