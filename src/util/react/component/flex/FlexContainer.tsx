import React, {CSSProperties, ReactNode} from "react";
import {FunctionComponentReturnType} from "../../types";
import {augmentClass} from "../../augmentClass";
import {SemiRequired} from "../../../typescript/types/SemiRequired";
import {nodeIsElement} from "../../node/nodeIsElement";
import FlexItem, {FlexItemProps} from "./FlexItem";
import nodeIsRenderable from "../../node/nodeIsRenderable";

export type FlexContainerProps = JSX.IntrinsicElements["div"] & {
    style: Omit<
        SemiRequired<
            CSSProperties,
            "flexDirection" | "flexWrap" | "justifyContent" | "alignItems" | "alignContent"
        >,
        "display"
    >
    itemProps?: (child: ReactNode, index: number) => FlexItemProps
}

export default function FlexContainer(
    props: FlexContainerProps
): FunctionComponentReturnType {
    let {
        children,
        ...divProps
    } = props;

    const wrappedChildren = React.Children.map(
        children,
        (child, index) => {
            if (!nodeIsRenderable(child)) return undefined;
            return <FlexItem
                key={nodeIsElement(child) ? child.key : undefined}
                {...(props.itemProps === undefined ? {} : props.itemProps(child, index))}

            >
                {child}
            </FlexItem>
        }
    );

    divProps.style.display = "flex";

    return <div
        {...augmentClass(divProps, "FlexContainer")}
    >
        {wrappedChildren}
    </div>
}