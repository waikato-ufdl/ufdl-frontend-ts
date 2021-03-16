import {ReactElement, ReactNode} from "react";
import nodeIsRenderable from "./nodeIsRenderable";
import nodeIsText from "./nodeIsText";

export function nodeIsElement(node: ReactNode): node is ReactElement {
    if (!nodeIsRenderable(node) || nodeIsText(node)) return false;

    return typeof node === "object" && 'key' in node;
}