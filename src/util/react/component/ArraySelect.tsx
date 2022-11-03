import React from "react";
import {Controllable, useControllableState} from "../hooks/useControllableState";
import asChangeEventHandler from "../asChangeEventHandler";
import {constantInitialiser} from "../../typescript/initialisers";
import {anyToString} from "../../typescript/strings/anyToString";
import {FunctionComponentReturnType} from "../types";

/**
 * Props passed to an {@link ArraySelect} component.
 *
 * @property values
 *          The array of values from which to select a value.
 * @property selected
 *          The index of the value to show as selected. {@link Controllable}. Invalid values will show
 *          up as the first option, either the empty option (if enabled, see below), or the first element
 *          of the array.
 * @property labelFunction
 *          An optional function to extract the label for each array-element's option in the select list.
 * @property onChange
 *          Optional callback to call when the selected option changes. The value will be undefined and
 *          the index will be -1 when the first empty option is selected (if enabled, see below).
 * @property disabled
 *          Whether to disable selection input.
 * @property disableFirstEmptyOption
 *          Whether to remove the ability to select no option. By default, an unlabelled option
 *          is injected first into the select input, which, when selected, corresponds to no selection
 *          from the array.
 */
export type ArraySelectProps<T> = {
    values: readonly T[]
    selected: Controllable<number>
    labelFunction?: (item: T, index: number) => string
    onChange?: (value: T | undefined, index: number) => void
    disabled?: boolean
    disableFirstEmptyOption?: boolean
}

/**
 * Component for selecting an element from an array.
 *
 * @param props
 *          The props to the component.
 */
export function ArraySelect<T>(
    props: ArraySelectProps<T>
): FunctionComponentReturnType {
    // Create state for maintaining the selected index, or mirroring the control value
    const [selectedIndex, setSelectedIndex] = useControllableState<number>(
        props.selected,
        constantInitialiser(-1)
    );

    // Extract props
    const {
        values,
        onChange,
        disabled
    } = props;

    // Apply defaults
    const labelFunction = props.labelFunction ?? anyToString
    const disableFirstEmptyOption = props.disableFirstEmptyOption ?? false

    // Create a select-option for each value in the array, whose value is its corresponding element's index
    const valueOptions: JSX.Element[] = values.map(
        (value, index) =>
            <option value={index.toString()}>
                {labelFunction(value, index)}
            </option>
    );

    // Insert an unlabelled option for selecting no element, if functionality not disabled
    if (!disableFirstEmptyOption) {
        valueOptions.unshift(<option value={(-1).toString()}>{""}</option>)
    }

    // Create a change handler for the select input which calls the callback
    const onChangeHandler = asChangeEventHandler(
        onChange === undefined
            ? setSelectedIndex
            : index => {
                // Update internal state
                setSelectedIndex(index);

                // Get the array element corresponding to the selected index, unless the
                // unlabelled option was selected, in which case the element is undefined
                const value = index in props.values
                    ? props.values[index]
                    : undefined

                // Fire the callback
                onChange(value, index);
            },
        Number.parseInt
    );

    // Map invalid selections to the first option
    const validatedIndex = Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < values.length
        ? selectedIndex
        : disableFirstEmptyOption
            ? 0
            : -1

    return <select
        className={"ArraySelect"}
        onChange={onChangeHandler}
        value={validatedIndex.toString()}
        disabled={disabled}
    >
        {valueOptions}
    </select>
}