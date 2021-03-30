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

export type PickLabelModalProps = {
    position: [number, number] | undefined
    onSubmit: (label: Optional<string>) => void
    onCancel: () => void
    labelColours: LabelColours
}

export default function PickLabelModal(
    props: PickLabelModalProps
): FunctionComponentReturnType {

    const [label, setLabel] = useStateSafe<Optional<string>>(constantInitialiser(undefined));

    const onSubmit = (label: Optional<string>) => {
        if (label === "") label = undefined;
        setLabel(undefined);
        props.onSubmit(label);
    };

    const onCancel = () => {
        setLabel(undefined);
        props.onCancel()
    };

    return <LocalModal
        position={props.position}
        onCancel={onCancel}
    >
        <Form onSubmit={() => onSubmit(label)}>
            <input value={label} onChange={asChangeEventHandler(setLabel)} autoFocus/>
        </Form>

        <LabelSelect
            label={label}
            onRelabelled={(_, newLabel) => onSubmit(newLabel)}
            labelColours={props.labelColours}
            style={{
                border: "1px solid black"
            }}
        />

        <button
            onClick={() => onSubmit(undefined)}
        >
            No label
        </button>

    </LocalModal>
}
