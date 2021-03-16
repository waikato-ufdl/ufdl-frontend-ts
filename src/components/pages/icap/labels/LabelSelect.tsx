import {FunctionComponentReturnType} from "../../../../util/react/types";
import {LabelColours} from "./LabelColours";
import {Optional} from "ufdl-js-client/util";
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
    label: string | undefined,
    labelColours: LabelColours
    children?: never
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

    const onChange = asChangeEventHandler(
        (value: Optional<string>) => {
            if (value === "") value = undefined;
            if (value !== props.label) props.onRelabelled(props.label, value);
        }
    );

    const labelOptions = mapToArray(
        props.labelColours,
        (label, colour) => <LabelSelectOption label={label} colour={colour}/>
    );

    if (style === undefined) style = {};

    style.backgroundColor = label === undefined ?
            "white" :
            props.labelColours.get(label);

    return <select
        className={"LabelSelect"}
        value={label === undefined ? "" : label}
        onChange={onChange}
        style={style}
    >
        <LabelSelectOption label={""} colour={"white"}/>
        {labelOptions}
    </select>

}
