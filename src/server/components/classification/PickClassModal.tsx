import "./PickClassModal.css";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import {ClassColours} from "../../util/classification";
import {FunctionComponentReturnType} from "../../../util/react/types";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import LocalModal from "../../../util/react/component/LocalModal";
import {Form} from "../../../util/react/component/Form";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import React from "react";
import ClassSelect from "./ClassSelect";

export type PickClassModalProps = {
    position: [number, number] | undefined
    onSubmit: (label: Classification) => void
    onCancel: () => void
    colours: ClassColours
    confirmText: string
}

export default function PickClassModal(
    props: PickClassModalProps
): FunctionComponentReturnType {
    // The contents of the label text box
    const [label, setLabel] = useStateSafe<Classification>(constantInitialiser(NO_CLASSIFICATION));

    const onSubmit = () => {
        props.onSubmit(label);
        setLabel(NO_CLASSIFICATION);
    };

    const onCancel = () => {
        setLabel(NO_CLASSIFICATION);
        props.onCancel()
    };

    return <LocalModal
        className={"PickLabelModal"}
        position={props.position}
        onCancel={onCancel}
    >
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
            />
        </label>

        <button
            onClick={onSubmit}
        >
            {props.confirmText}
        </button>

    </LocalModal>
}
