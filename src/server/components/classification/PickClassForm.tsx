import {FunctionComponentReturnType} from "../../../util/react/types/FunctionComponentReturnType";
import {Form} from "../../../util/react/component/Form";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {OptionalAnnotations} from "../../types/annotations/OptionalAnnotations";
import {Classification} from "../../types/annotations/Classification";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import ClassSelect from "./ClassSelect";
import React from "react";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {ClassColours} from "../../util/classification";
import "./PickClassForm.css";
import {DEFAULT} from "../../../util/typescript/default";

export type PickClassFormProps = {
    onSubmit: (label: OptionalAnnotations<Classification>) => void
    colours: ClassColours
    confirmText: string
}

export default function PickClassForm(
    props: PickClassFormProps
): FunctionComponentReturnType {

    // The contents of the label text box
    const [label, setLabel] = useStateSafe<OptionalAnnotations<Classification>>(constantInitialiser(NO_ANNOTATION));

    const onSubmit = () => {
        props.onSubmit(label);
        setLabel(NO_ANNOTATION);
    };

    return <div>
        <p>Enter new or select existing label,</p>
        <p>leave empty for no label</p>
        <Form onSubmit={onSubmit}>
            <label>
                New label
                <input
                    value={label === NO_ANNOTATION ? "" : label}
                    onChange={asChangeEventHandler(setLabel)}
                    autoFocus
                />
            </label>
        </Form>

        <label>
            Existing label
            <ClassSelect
                classification={label}
                onReclassify={(_, newLabel) => setLabel(newLabel)}
                colours={props.colours}
                style={{
                    border: "1px solid black"
                }}
                allowSelectNone
                noAnnotationLabel={DEFAULT}
            />
        </label>

        <button
            onClick={onSubmit}
        >
            {props.confirmText}
        </button>
    </div>
}