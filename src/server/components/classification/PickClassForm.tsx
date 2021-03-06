import {FunctionComponentReturnType} from "../../../util/react/types";
import {Form} from "../../../util/react/component/Form";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import ClassSelect from "./ClassSelect";
import React from "react";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {ClassColours} from "../../util/classification";
import "./PickClassForm.css";

export type PickClassFormProps = {
    onSubmit: (label: Classification) => void
    colours: ClassColours
    confirmText: string
}

export default function PickClassForm(
    props: PickClassFormProps
): FunctionComponentReturnType {

    // The contents of the label text box
    const [label, setLabel] = useStateSafe<Classification>(constantInitialiser(NO_CLASSIFICATION));

    const onSubmit = () => {
        props.onSubmit(label);
        setLabel(NO_CLASSIFICATION);
    };

    return <div>
        <p>Enter new or select existing label,</p>
        <p>leave empty for no label</p>
        <Form onSubmit={onSubmit}>
            <label>
                New label
                <input
                    value={label === NO_CLASSIFICATION ? "" : label}
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
            />
        </label>

        <button
            onClick={onSubmit}
        >
            {props.confirmText}
        </button>
    </div>
}