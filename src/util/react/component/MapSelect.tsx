import React from "react";
import {Controllable, useControllableState} from "../hooks/useControllableState";
import asChangeEventHandler from "../asChangeEventHandler";
import {constantInitialiser} from "../../typescript/initialisers";
import {Absent, Possible} from "../../typescript/types/Possible";
import {mapToArray} from "../../map";


export type MapSelectProps<V> = {
    values: ReadonlyMap<string, V>
    value: Controllable<string | undefined>
    onChange?: (value: Possible<V>, key?: string) => void
    disabled?: boolean
}

export function MapSelect<V>(
    props: MapSelectProps<V>
) {
    // Create state
    const [selected, setSelected, selectedLocked] = useControllableState<string | undefined>(
        props.value,
        constantInitialiser(undefined)
    );

    // Extract props
    const {
        values,
        onChange,
        disabled
    } = props;

    // Create an option for each value
    const valueOptions = mapToArray(
        values,
        (key) => <option key={key} value={`+${key}`}>{key}</option>
    );

    // Create the absent option
    const absentOption = <option value={""}>{""}</option>;

    const onChangeActual = asChangeEventHandler(
        (value) => {
            const key = value === "" ? undefined : value.slice(1);

            setSelected(key);

            const actualValue = key === undefined ? Absent : values.get(key);

            if (onChange !== undefined) onChange(actualValue!, key);
        }
    );

    return <select
        className={"MapSelect"}
        onChange={onChangeActual}
        value={selected === undefined ? "" : `+${selected}`}
        disabled={disabled}
    >
        {absentOption}
        {valueOptions}
    </select>
}