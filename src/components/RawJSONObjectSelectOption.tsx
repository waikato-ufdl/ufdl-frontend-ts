import React from "react";
import {RawModelInstance} from "ufdl-ts-client/types/base";

export type RawJSONObjectSelectOptionProps<M extends RawModelInstance>
    = Omit<React.OptionHTMLAttributes<HTMLOptionElement>, 'key' | 'value'>
    & {
        item: M,
        labelMapFunction: (json: M) => string,
        children?: never
    }

export function RawJSONObjectSelectOption<M extends RawModelInstance>(
    props: RawJSONObjectSelectOptionProps<M>
) {
    const {
        item,
        labelMapFunction,
        ...optionProps
    } = props;

    const pk = item.pk;
    const label = labelMapFunction(item);

    return <option
        key={pk}
        value={pk}
        {...optionProps}
    >
        {label}
    </option>
}
