import "./ClassSelect.css";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {OptionalAnnotations} from "../../types/annotations/OptionalAnnotations";
import {Classification} from "../../types/annotations/Classification";
import {asLabel, ClassColour, ClassColours} from "../../util/classification";
import {FunctionComponentReturnType} from "../../../util/react/types/FunctionComponentReturnType";
import {ClassSelectOption} from "./ClassSelectOption";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import {mapToArray} from "../../../util/map";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {handleSingleDefault, WithDefault} from "../../../util/typescript/default";
import {constantInitialiser} from "../../../util/typescript/initialisers";

export type ClassSelectProps
    = Omit<
        JSX.IntrinsicElements["select"],
        'value'
    > & {
    onReclassify: (oldClass: OptionalAnnotations<Classification> | undefined, newClass: OptionalAnnotations<Classification>) => void,
    classification?: OptionalAnnotations<Classification>
    colours: ClassColours
    children?: never
    allowSelectNone?: boolean
    noAnnotationLabel: WithDefault<string>
}

export default function ClassSelect(
    props: ClassSelectProps
): FunctionComponentReturnType {

    let {
        onReclassify,
        classification,
        colours,
        style,
        allowSelectNone,
        noAnnotationLabel,
        ...selectProps
    } = props;

    const defaultedNoAnnotationLabel = handleSingleDefault(noAnnotationLabel, constantInitialiser(""))

    const onChange = useDerivedState(
        ([onReclassify, classification, noAnnotationLabel]) => (value: string | undefined) => {
            console.log("Class select onChange", value)
            onReclassify(
                classification,
                value === "" || value === noAnnotationLabel || value === undefined
                    ? NO_ANNOTATION
                    : value
            );
        },
        [onReclassify, classification, defaultedNoAnnotationLabel] as const
    )

    const updatedStyle = useDerivedState(
        ([style, classification]) => {
            if (style === undefined)
                style = {}
            else
                style = {...style}

            style.backgroundColor = classification === NO_ANNOTATION || classification === undefined
                ? "white"
                : colours.get(classification);

            return style
        },
        [style, classification, colours] as const
    )

    const toOption = (
        classification: OptionalAnnotations<Classification>,
        colour: ClassColour
    ) => {
        return <ClassSelectOption
            label={asLabel(classification, defaultedNoAnnotationLabel)}
            colour={colour}
        />
    }


    return <select
        className={"ClassSelect"}
        value={classification === undefined ? undefined : asLabel(classification, defaultedNoAnnotationLabel)}
        onChange={asChangeEventHandler(onChange)}
        style={updatedStyle}
        {...selectProps}
    >
        {classification === undefined && <option className={"ClassSelectOption"}/>}
        {allowSelectNone === true && toOption(NO_ANNOTATION, "white")}
        {mapToArray(colours, toOption)}
    </select>
}