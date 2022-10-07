import React from "react";
import {RawModelInstance} from "ufdl-ts-client/types/base";
import {ArraySelect} from "../util/react/component/ArraySelect";
import {Controllable, mapControllable} from "../util/react/hooks/useControllableState";

/**
 * Props passed to an {@link RawJSONObjectSelect} component.
 *
 * @property values
 *          The array of {@link RawModelInstance} JSON values from which to select.
 * @property selectedPK
 *          The PK of the value to show as selected. {@link Controllable}. Invalid values will show
 *          up as the first option, either the empty option (if enabled, see below), or the first element
 *          of the array.
 * @property labelFunction
 *          A function to extract the label for each JSON value's option in the select list.
 * @property onChange
 *          Optional callback to call when the selected option changes. The value will be undefined and
 *          the index will be undefined when the first empty option is selected (if enabled, see below).
 * @property disabled
 *          Whether to disable selection input.
 * @property disableFirstEmptyOption
 *          Whether to remove the ability to select no option. By default, an unlabelled option
 *          is injected first into the select input, which, when selected, corresponds to no selection
 *          from the array.
 */
export type RawJSONObjectSelectProps<M extends RawModelInstance> = {
    values: readonly M[]
    selectedPK: Controllable<number | undefined>
    labelFunction: (json: M) => string
    onChange?: (item?: M, pk?: number) => void
    disabled?: boolean
    disableFirstEmptyOption?: boolean
}

/**
 * Component for selecting an element from an array of JSON-serialised models (see {@link RawModelInstance}).
 *
 * @param props
 *          The props to the component.
 */
export function RawJSONObjectSelect<M extends RawModelInstance>(
    props: RawJSONObjectSelectProps<M>
) {
    // Extract the props
    const {
        values,
        selectedPK,
        onChange,
        ...otherArraySelectProps
    } = props;

    // Create a change handler which maps the index-based ArraySelect handler
    // to our provided PK-based handler
    const onChangeActual = onChange === undefined
        ? undefined
        : (value: M | undefined, index: number) => {
            onChange(value,  index === -1 ? undefined : value!.pk)
        }

    // Map the PK control value to an index control value
    const index = mapControllable(
        selectedPK,
        pk => values.findIndex(json => json.pk === pk)
    )

    return <ArraySelect<M>
        values={values}
        selected={index}
        onChange={onChangeActual}
        {...otherArraySelectProps}
    />
}