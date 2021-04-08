import {Optional} from "ufdl-ts-client/util";
import {LabelColours} from "./LabelColours";
import {FunctionComponentReturnType} from "../../../../util/react/types";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import {Form} from "../../../Form";
import asChangeEventHandler from "../../../../util/react/asChangeEventHandler";
import LabelSelect from "./LabelSelect";
import React from "react";
import LocalModal from "../../../../util/react/component/LocalModal";
import "./PickLabelModal.css";

export type PickLabelModalProps = {
    position: [number, number] | undefined
    onSubmit: (label: Optional<string>) => void
    onCancel: () => void
    labelColours: LabelColours
    confirmText: string
}

export default function PickLabelModal(
    props: PickLabelModalProps
): FunctionComponentReturnType {
    // The contents of the label text box
    const [label, setLabel] = useStateSafe<string>(constantInitialiser(""));

    const onSubmit = () => {
        props.onSubmit(label === "" ? undefined : label);
        setLabel("");
    };

    const onCancel = () => {
        setLabel("");
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
                <input value={label} onChange={asChangeEventHandler(setLabel)} autoFocus/>
            </label>
        </Form>

        <label>
            Existing label
            <LabelSelect
                label={label}
                onRelabelled={(_, newLabel) => setLabel(newLabel === undefined ? "" : newLabel)}
                labelColours={props.labelColours}
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
