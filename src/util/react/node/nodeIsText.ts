import {ReactNode, ReactText} from "react";

export default function nodeIsText(node: ReactNode): node is ReactText {
    const nodeType = typeof node;
    return nodeType === "string" || nodeType === "number";
}
