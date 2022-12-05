import {FunctionComponentReturnType} from "../../types/FunctionComponentReturnType";
import {CSSProperties} from "react";
import {augmentClass} from "../../augmentClass";

export type FlexItemProps = JSX.IntrinsicElements["div"] & {
    style?: Omit<CSSProperties, "position">

}

// TODO: Move to CSS
export default function FlexItem(
    props: FlexItemProps
): FunctionComponentReturnType {

    const {
        style,
        ...divProps
    } = props;

    const itemStyle: CSSProperties = {
        ...style,
        position: "relative"
    };

    return <div
        style={itemStyle}
        {...augmentClass(divProps, "FlexItem")}
    >
        {props.children}
    </div>

}