import React from "react";
import {RawModelInstance} from "ufdl-ts-client/types/base";
import {mapFromArray} from "../util/map";
import {ArraySelect} from "../util/react/component/ArraySelect";
import useDerivedState from "../util/react/hooks/useDerivedState";
import {Controllable} from "../util/react/hooks/useControllableState";
import {isPresent, Possible} from "../util/typescript/types/Possible";

export type RawJSONObjectSelectProps<M extends RawModelInstance> = {
    values: readonly M[]
    value: Controllable<number>
    labelFunction: (json: M) => string
    onChange?: (item?: M, pk?: number) => void
    disabled?: boolean
}

export function RawJSONObjectSelect<M extends RawModelInstance>(
    props: RawJSONObjectSelectProps<M>
) {

    const {values, value, labelFunction, onChange, disabled} = props;

    const indexToPk = useDerivedState(
        (values) => values.map((value) => value.pk),
        values
    );

    const pkToIndex = useDerivedState(
        (values) => mapFromArray(
            values,
            (value, index) => [value.pk, index]
        ),
        values
    );

    const onChangeActual = onChange === undefined ?
        undefined :
        (value: Possible<M>, index: number) => {
            if (isPresent(value)) {
                onChange(value, indexToPk[index])
            } else {
                onChange()
            }
        };

    const pk = typeof value === "number" ? value === -1 ? -1 : pkToIndex.get(value) : value;

    return <ArraySelect<M[]>
        values={props.values}
        value={pk === undefined ? -2 : pk}
        labelFunction={labelFunction}
        onChange={onChangeActual}
        disabled={disabled}
    />
}