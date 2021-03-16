import React from "react";
import {LabelColour} from "./LabelColours";

export type LabelAndColourPickerProps = {
    label: string
    colour: LabelColour
    onColourChanged: (newColour: LabelColour) => void
    onLabelDeleted: () => void
}

export default function LabelAndColourPicker(props: LabelAndColourPickerProps) {
    return <div className={"LabelAndColourPicker"}>
        <label>
            {props.label + ": "}
            <input
                type={"color"}
                value={props.colour}
                onChange={
                    (event) => {
                        props.onColourChanged(event.target.value);
                        event.stopPropagation();
                    }
                }
            />
            <button
                onClick={props.onLabelDeleted}
            >
                -
            </button>
        </label>
    </div>
}