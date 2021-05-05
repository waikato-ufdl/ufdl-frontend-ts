import React, {CSSProperties} from "react";
import {asLabel, ClassColour} from "../../util/classification";
import {Classification} from "../../types/annotations";

export type ClassSelectOptionProps = {
    classification: Classification,
    colour: ClassColour
    onClick?: () => void
}

export function ClassSelectOption(props: ClassSelectOptionProps) {
    const style: CSSProperties = {
        backgroundColor: props.colour
    };

    const label = asLabel(props.classification, "");

    return <option
        className={"ClassSelectOption"}
        style={style}
        value={label}
        onClick={props.onClick}
    >
        {label}
    </option>
}
