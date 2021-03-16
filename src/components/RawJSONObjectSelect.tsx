import React from "react";
import {RawJSONObject} from "ufdl-js-client/types";
import {mapFromArray} from "../util/map";
import {ArraySelect} from "../util/react/component/ArraySelect";
import useDerivedState from "../util/react/hooks/useDerivedState";

export type RawJSONObjectSelectProps = {
    values: readonly RawJSONObject[]
    value?: number
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
        (value: RawJSONObject | undefined, index: number) => {
            if (index === -1) {
                onChange()
            } else {
                onChange(value, indexToPk[index])
            }
        };

    return <ArraySelect<RawJSONObject>
        values={props.values}
        value={value === undefined ? undefined : value === -1 ? -1 : pkToIndex.get(value) }
        labelFunction={labelFunction}
        onChange={onChangeActual}
        disabled={disabled}
    />
}