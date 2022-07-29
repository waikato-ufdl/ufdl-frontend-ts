import "./ClassSelect.css";
import {Classification, NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
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
    onReclassify: (oldClass: OptionalAnnotations<Classification>, newClass: OptionalAnnotations<Classification>) => void,
    classification: OptionalAnnotations<Classification>
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
                ? NO_ANNOTATION
                : value
        );
    }

    if (style === undefined) style = {};

    style.backgroundColor = classification === NO_ANNOTATION ?
            "white" :
            props.colours.get(classification);

    return <select
        className={"ClassSelect"}
        value={asLabel(classification, "")}
        onChange={asChangeEventHandler(onChange)}
        style={style}
        {...selectProps}
    >
        {props.allowSelectNone === true ? toOption(NO_ANNOTATION, "white") : undefined}
        {mapToArray(props.colours, toOption)}
    </select>
}


function toOption(
    classification: OptionalAnnotations<Classification>,
    colour: ClassColour
) {
    return <ClassSelectOption
        classification={classification}
        colour={colour}
    />
}