import {Component, JSXElementConstructor} from "react";

export type JSXClassElementConstructor<P> = new (props: P) => Component<any, any>

/**
 * Determines if a JSX element constructor refers to a class-based component.
 *
 * Uses code from React's internal shouldConstruct function.
 *
 * @param constructor
 *          The JSX element constructor.
 * @return
 *          Whether the element is a class-element.
 */
export function jsxElementConstructorIsClass<P>(
    constructor: JSXElementConstructor<P>
): constructor is JSXClassElementConstructor<P> {
    const prototype = constructor.prototype;
    return prototype !== undefined && prototype.isReactComponent !== undefined;
}
