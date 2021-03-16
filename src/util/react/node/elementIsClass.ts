import {ReactElement} from "react";
import {JSXClassElementConstructor, jsxElementConstructorIsClass} from "../jsx/JSXClassElementConstructor";
import elementIsCustom from "./elementIsCustom";

/**
 * Whether the JSX element has a class constructor.
 *
 * @param element
 */
export default function elementIsClass(
    element: ReactElement
): element is ReactElement<any, JSXClassElementConstructor<any>> {
    return elementIsCustom(element) && jsxElementConstructorIsClass(element.type);
}
