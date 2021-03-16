import React from "react";
import {useInterlockedState} from "../hooks/useInterlockedState";
import asChangeEventHandler from "../asChangeEventHandler";

export type ArraySelectProps<T extends {}> = {
    values: Readonly<T[]>
    value?: number
    labelFunction?: (item: T, index: number) => string
    onChange?: (value: T | undefined, index: number) => void
    disabled?: boolean
}

export function ArraySelect<T extends {}>(props: ArraySelectProps<T>) {
    // Create state
    const [value, setValue, valueLocked] = useInterlockedState<number>(props.value, () => -1);

    // Extract props
    const {
        values,
        labelFunction,
        onChange,
        disabled
    } = props;

    // Apply defaults
    const labelFunctionActual = labelFunction || ((item) => item.toString());

    // Create an option for each value
    const valueOptions = values.map(
        (value, index) => {
            return <option value={index.toString()}>
                {labelFunctionActual(value, index)}
            </option>
        }
    );

    const onChangeActual = asChangeEventHandler(
        (index) => {
            setValue(index);

            const value = index !== -1 ? props.values[index] : undefined;

            if (onChange !== undefined) onChange(value, index);
        },
        Number.parseInt
    );

    return <select
        className={"ArraySelectProps"}
        onChange={onChangeActual}
        value={value.toString()}
        disabled={disabled}
    >
        <option value={(-1).toString()}>
            {""}
        </option>
        {valueOptions}
    </select>



}