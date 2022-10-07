import React, {CSSProperties, ReactElement} from "react";
import {augmentClass} from "../augmentClass";
import {FunctionComponentReturnType} from "../types";

const CENTER_CONTENT_CONSTANT_STYLE = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%"
} as const;

export type CenterContentProps = JSX.IntrinsicElements["div"] & {
    style?: Omit<
        CSSProperties,
        keyof typeof CENTER_CONTENT_CONSTANT_STYLE
        >
    children: ReactElement
}

export default function CenterContent(
    props: CenterContentProps
): FunctionComponentReturnType {

    const {
        style,
        children,
        ...divProps
    } = props;

    return <div
        style={{
            ...style,
            ...CENTER_CONTENT_CONSTANT_STYLE
        }}
        {...augmentClass(divProps, "CenterContent")}
    >
        {children}
    </div>

}