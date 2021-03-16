import {JSXElementConstructor, ReactElement} from "react";

export default function elementIsCustom(
    element: ReactElement
): element is ReactElement<any, JSXElementConstructor<any>> {
    return typeof element.type !== "string";
}
