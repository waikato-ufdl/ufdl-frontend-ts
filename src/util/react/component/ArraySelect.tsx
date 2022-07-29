import React from "react";
import {Controllable, useControllableState} from "../hooks/useControllableState";
import asChangeEventHandler from "../asChangeEventHandler";
import {constantInitialiser} from "../../typescript/initialisers";
import {ElementType} from "../../typescript/types/array/ElementType";
import {Absent, Possible} from "../../typescript/types/Possible";
import arrayMap from "../../typescript/arrays/arrayMap";

export type ArraySelectProps<T extends readonly unknown[]> = {
    values: Readonly<T>
    value: Controllable<number>
    labelFunction?: (item: ElementType<T>, index: number) => string
    onChange?: (value: Possible<ElementType<T>>, index: number) => void
    disabled?: boolean
    disableFirstEmptyOption?: boolean
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
    const valueOptions = arrayMap(
        values,
        (value, index) => {
            return <option value={index.toString()}>
                {labelFunctionActual(value, index)}
            </option>
        }
    );

    const onChangeActual = asChangeEventHandler(
        (index) => {
            setValue(index);

            const value = index in props.values ? props.values[index] : Absent;

            if (onChange !== undefined) onChange(value, index);
        },
        Number.parseInt
    );

    const firstEmptyOption = props.disableFirstEmptyOption
        ? undefined
        : <option value={(-1).toString()}>
            {""}
        </option>

    return <select
        className={"ArraySelect"}
        onChange={onChangeActual}
        value={value.toString()}
        disabled={disabled}
    >
        {firstEmptyOption}
        {valueOptions}
    </select>
}