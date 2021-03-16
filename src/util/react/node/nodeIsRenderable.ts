import {ReactChild, ReactFragment, ReactNode, ReactPortal} from "react";

export default function nodeIsRenderable(node: ReactNode): node is ReactChild | ReactFragment | ReactPortal {
    return node !== undefined && node !== null && typeof node !== "boolean";
}
