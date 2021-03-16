import {JSXElementConstructor, ReactElement} from "react";
import {jsxElementConstructorIsClass} from "./JSXClassElementConstructor";

export type JSXFunctionElementConstructor<P> = (props: P) => ReactElement<any, any> | null

export function jsxElementConstructorIsFunction<P>(
    constructor: JSXElementConstructor<P>
): constructor is JSXFunctionElementConstructor<P> {
    return !jsxElementConstructorIsClass(constructor);
}
