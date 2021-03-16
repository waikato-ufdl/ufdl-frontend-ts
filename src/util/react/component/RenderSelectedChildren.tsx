import React, {PropsWithChildren, ReactElement, ReactNode} from "react";
import {cloneElementAsHideable} from "../hideable";
import {nodeIsElement} from "../node/nodeIsElement";
import getNodeID from "../node/getNodeID";
import elementIsCustom from "../node/elementIsCustom";
import {FunctionComponentReturnType} from "../types";

export type ManualChildSelector = (child: ReactNode, index: number) => boolean

export type ChildSelector =
    | null // Render no children
    | number // Render the child at the given index
    | string // Render the child with the given ID
    | ManualChildSelector // Manually select children to render, and whether to keep searching

export type RenderSelectedChildrenProps = {
    selector: ChildSelector
}

const manualNullSelector: ManualChildSelector = () => false;

function manualIndexSelector(index: number): ManualChildSelector {
    return (_, childIndex) => index === childIndex
}

function manualIDSelector(id: string): ManualChildSelector {
    return (child) => {
        if (!nodeIsElement(child)) return false;
        const childID = getNodeID(child);
        return childID === id;
    }
}

export default function RenderSelectedChildren(
    props: PropsWithChildren<RenderSelectedChildrenProps>
): FunctionComponentReturnType {
    const {selector, children} = props;

    const manualSelector: ManualChildSelector =
        (selector === null) ?
        manualNullSelector :
        (typeof selector === "number") ?
        manualIndexSelector(selector) :
        (typeof selector === "string") ?
        manualIDSelector(selector) :
        selector;

    const hiddenChildren = React.Children.map(
        children,
        (child: ReactNode, index) => {
            const shouldHide = !manualSelector(child, index);
            if (nodeIsElement(child) && elementIsCustom(child))
                return cloneElementAsHideable(child, shouldHide);
            else
                return shouldHide ? undefined : child;
        }
    );

    if (hiddenChildren === undefined || hiddenChildren === null)
        return null;
    else
        return <>{hiddenChildren}</>
}
