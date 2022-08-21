import React, {CSSProperties} from "react";
import {ClassColour} from "../../util/classification";

export type ClassSelectOptionProps = {
    label: string,
    colour: ClassColour
    onClick?: () => void
}

export function ClassSelectOption(props: ClassSelectOptionProps) {
    const style: CSSProperties = {
        backgroundColor: props.colour
    };

    return <option
        className={"ClassSelectOption"}
        style={style}
        value={props.label}
        onClick={props.onClick}
    >
        {props.label}
    </option>
}
