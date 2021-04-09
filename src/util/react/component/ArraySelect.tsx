import React from "react";
import {Controllable, useControllableState} from "../hooks/useControllableState";
import asChangeEventHandler from "../asChangeEventHandler";
import {constantInitialiser} from "../../typescript/initialisers";
import {ElementType} from "../../typescript/types/array/ElementType";
import {Absent, Possible} from "../../typescript/types/Possible";

export type ArraySelectProps<T extends readonly unknown[]> = {
    values: Readonly<T>
    value: Controllable<number>
    labelFunction?: (item: ElementType<T>, index: number) => string
    onChange?: (value: Possible<ElementType<T>>, index: number) => void
    disabled?: boolean
}

function defaultLabelFunction<T extends readonly unknown[]>(
    item: ElementType<T>
): string {
    return `${item}`;
}

export function ArraySelect<T extends readonly unknown[]>(
    props: ArraySelectProps<T>
) {
    // Create state
    const [value, setValue, valueLocked] = useControllableState<number>(
        props.value,
        constantInitialiser(-1)
    );

    // Extract props
    const {
        values,
        labelFunction,
        onChange,
        disabled
    } = props;

    // Apply defaults
    const labelFunctionActual = labelFunction || defaultLabelFunction;

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

            const value = index !== -1 ? props.values[index] : Absent;

            if (onChange !== undefined) onChange(value, index);
        },
        Number.parseInt
    );

    return <select
        className={"ArraySelect"}
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