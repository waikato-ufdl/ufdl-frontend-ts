import {ReactElement} from "react";

export default function getNodeID(node: ReactElement): string | undefined {
    const props = node.props;
    if (props === null || props === undefined) return undefined;
    const id = node.props.id;
    if (typeof id !== "string") return undefined;
    return id;
}
