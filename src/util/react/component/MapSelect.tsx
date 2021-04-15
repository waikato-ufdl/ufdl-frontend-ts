import React from "react";
import {Controllable, useControllableState} from "../hooks/useControllableState";
import asChangeEventHandler from "../asChangeEventHandler";
import {constantInitialiser} from "../../typescript/initialisers";
import {Absent, Possible} from "../../typescript/types/Possible";
import {mapToArray} from "../../map";


export type MapSelectProps<V> = {
    /** The map from option labels to their corresponding value. */
    values: ReadonlyMap<string, V>

    /** The controlled value of the drop-down (by label), or a non-controlling flag. */
    value: Controllable<string | undefined>

    /** The action to perform when the selected value changes (default: do nothing). */
    onChange?: (value: Possible<V>, key?: string) => void

    /** Whether the drop-down should be disabled (default: false). */
    disabled?: boolean
}

/**
 * A select drop-down which lets the user select a value (of
 * any type V) by its corresponding string label. The relationship between
 * value and label is provided in the form of a map from label to value.
 *
 * Includes an option for no selection.
 *
 * @param props
 *          The properties of the drop-down.
 */
export function MapSelect<V>(
    props: MapSelectProps<V>
) {
    // Destructure the props
    const {
        values,
        value,
        onChange,
        disabled
    } = props;

    // Create controllable state for the selected value
    const [selectedLabel, setSelectedLabel] = useControllableState<string | undefined>(
        value,
        constantInitialiser(undefined)
    );

    // Create an option for each selectable value
    const valueOptions = mapToArray(
        values,
        (key) => <option key={key} value={`+${key}`}>{key}</option>
    );

    // Create the absent option
    const absentOption = <option key={""} value={""}>{""}</option>;

    // Create an event handler which maps the disambiguation key to label/value
    const onChangeActual = asChangeEventHandler(
        (key) => {
            // Undo the disambiguation formatting done when creating the option
            const label = key === ""
                ? undefined
                : key.slice(1);

            // Attempt to change the selected label state
            setSelectedLabel(label);

            // Get the corresponding value for the label (Absent for the no-selection state)
            const value = label === undefined
                ? Absent
                : values.get(label)!;

            // Call the change handler if one was provided
            if (onChange !== undefined) onChange(value, label);
        }
    );

    return <select
        className={"MapSelect"}
        onChange={onChangeActual}
        value={selectedLabel === undefined ? "" : `+${selectedLabel}`}
        disabled={disabled}
    >
        {absentOption}
        {valueOptions}
    </select>
}