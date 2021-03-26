import React, {CSSProperties} from "react";
import {LabelColour} from "./LabelColours";

export type LabelSelectOptionProps = {
    label: string,
    colour: LabelColour
    onClick?: () => void
}

export function LabelSelectOption(props: LabelSelectOptionProps) {
    const style: CSSProperties = {backgroundColor: props.colour};

    return <option
        className={"LabelSelectOption"}
        style={style}
        value={props.label}
        onClick={props.onClick}
    >
        {props.label}
    </option>
}
