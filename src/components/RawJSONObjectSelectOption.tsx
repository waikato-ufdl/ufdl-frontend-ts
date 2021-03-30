import React from "react";
import {RawJSONObject} from "ufdl-ts-client/types";

export type RawJSONObjectSelectOptionProps = Omit<React.OptionHTMLAttributes<HTMLOptionElement>, 'key' | 'value'> & {
    item: RawJSONObject,
    labelMapFunction: (json: RawJSONObject) => string,
    children?: never
}

export function RawJSONObjectSelectOption(props: RawJSONObjectSelectOptionProps) {
    const {item, labelMapFunction, ...optionProps} = props;

    const pk = item['pk'] as number;
    const label = labelMapFunction(item);

    return <option key={pk} value={pk} {...optionProps}>
        {label}
    </option>
}
