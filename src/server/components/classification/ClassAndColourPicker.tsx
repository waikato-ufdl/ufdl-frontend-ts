import React from "react";
import {ClassColour} from "../../util/classification";

export type ClassAndColourPickerProps = {
    label: string
    colour: ClassColour
    onColourChanged: (newColour: ClassColour) => void
    onLabelDeleted: () => void
}

export default function ClassAndColourPicker(
    props: ClassAndColourPickerProps
) {
    return <div className={"ClassAndColourPicker"}>
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