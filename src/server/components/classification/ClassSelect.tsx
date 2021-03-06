import "./ClassSelect.css";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import {asLabel, ClassColour, ClassColours} from "../../util/classification";
import {FunctionComponentReturnType} from "../../../util/react/types";
import {ClassSelectOption} from "./ClassSelectOption";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import {mapToArray} from "../../../util/map";

export type ClassSelectProps
    = Omit<
        JSX.IntrinsicElements["select"],
        'value'
    > & {
    onReclassify: (oldClass: Classification, newClass: Classification) => void,
    classification: Classification
    colours: ClassColours
    children?: never
    allowSelectNone?: boolean
}

export default function ClassSelect(
    props: ClassSelectProps
): FunctionComponentReturnType {

    let {
        onReclassify,
        classification,
        colours,
        style,
        ...selectProps
    } = props;

    function onChange(value: string | undefined) {
        props.onReclassify(
            props.classification,
            value === "" || value === undefined
                ? NO_CLASSIFICATION
                : value
        );
    }

    function toOption(
        classification: Classification,
        colour: ClassColour
    ) {
        return <ClassSelectOption
            classification={classification}
            colour={colour}
        />
    }

    if (style === undefined) style = {};

    style.backgroundColor = classification === NO_CLASSIFICATION ?
            "white" :
            props.colours.get(classification);

    return <select
        className={"ClassSelect"}
        value={asLabel(classification, "")}
        onChange={asChangeEventHandler(onChange)}
        style={style}
        {...selectProps}
    >
        {props.allowSelectNone === true ? toOption(NO_CLASSIFICATION, "white") : undefined}
        {mapToArray(props.colours, toOption)}
    </select>
}
