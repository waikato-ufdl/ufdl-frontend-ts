import {ReactNode, ReactNodeArray} from "react";

export default function nodeIsArray(node: ReactNode): node is ReactNodeArray {
    return node instanceof Array;
}
