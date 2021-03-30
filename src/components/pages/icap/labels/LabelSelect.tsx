import {FunctionComponentReturnType} from "../../../../util/react/types";
import {LabelColour, LabelColours} from "./LabelColours";
import {Optional} from "ufdl-ts-client/util";
import {mapToArray} from "../../../../util/map";
import {LabelSelectOption} from "./LabelSelectOption";
import asChangeEventHandler from "../../../../util/react/asChangeEventHandler";
import "./LabelSelect.css";

export type LabelSelectProps
    = Omit<
        JSX.IntrinsicElements["select"],
        'value'
    > & {
    onRelabelled: (oldLabel?: string, newLabel?: string) => void,
    label: string | undefined
    labelColours: LabelColours
    children?: never
    allowSelectNone?: boolean
}

export default function LabelSelect(
    props: LabelSelectProps
): FunctionComponentReturnType {

    let {
        onRelabelled,
        label,
        labelColours,
        style,
        ...selectProps
    } = props;

    function onChange(value: Optional<string>) {
        if (value === "") value = undefined;
        props.onRelabelled(props.label, value);
    }

    function toOption(label: string | undefined, colour: LabelColour) {
        return <LabelSelectOption
            label={label === undefined ? "" : label}
            colour={colour}
        />
    }

    if (style === undefined) style = {};

    style.backgroundColor = label === undefined ?
            "white" :
            props.labelColours.get(label);

    return <select
        className={"LabelSelect"}
        value={label === undefined ? "" : label}
        onChange={asChangeEventHandler(onChange)}
        style={style}
    >
        {toOption(undefined, "white")}
        {props.allowSelectNone === true ? toOption("", "white") : undefined}
        {mapToArray(props.labelColours, toOption)}
    </select>
}
