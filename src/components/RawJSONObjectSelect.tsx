import React from "react";
import {RawJSONObject} from "ufdl-ts-client/types";
import {mapFromArray} from "../util/map";
import {ArraySelect} from "../util/react/component/ArraySelect";
import useDerivedState from "../util/react/hooks/useDerivedState";
import {Controllable} from "../util/react/hooks/useControllableState";
import {isPresent, Possible} from "../util/typescript/types/Possible";

export type RawJSONObjectSelectProps = {
    values: readonly RawJSONObject[]
    value: Controllable<number>
    labelFunction: (json: RawJSONObject) => string
    onChange?: (item?: RawJSONObject, pk?: number) => void
    disabled?: boolean
}

export function RawJSONObjectSelect(props: RawJSONObjectSelectProps) {

    const {values, value, labelFunction, onChange, disabled} = props;

    const indexToPk = useDerivedState(
        (values) => values.map((value) => value['pk'] as number),
        values
    );

    const pkToIndex = useDerivedState(
        (values) => mapFromArray(
            values,
            (value, index) => {
                const pk = value['pk'] as number;
                return [pk, index];
            }
        ),
        values
    );

    const onChangeActual = onChange === undefined ?
        undefined :
        (value: Possible<RawJSONObject>, index: number) => {
            if (isPresent(value)) {
                onChange(value, indexToPk[index])
            } else {
                onChange()
            }
        };

    const pk = typeof value === "number" ? value === -1 ? -1 : pkToIndex.get(value) : value;

    return <ArraySelect<RawJSONObject[]>
        values={props.values}
        value={pk === undefined ? -2 : pk}
        labelFunction={labelFunction}
        onChange={onChangeActual}
        disabled={disabled}
    />
}