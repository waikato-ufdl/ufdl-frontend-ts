import {Optional} from "ufdl-js-client/util";
import {LabelColours} from "./LabelColours";
import {FunctionComponentReturnType} from "../../../../util/react/types";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import ReactModal from "react-modal";
import {Form} from "../../../Form";
import asChangeEventHandler from "../../../../util/react/asChangeEventHandler";
import LabelSelect from "./LabelSelect";
import React from "react";

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

    const position = props.position === undefined ? [0, 0] : props.position;

    const onSubmit = (label: Optional<string>) => {
        if (label === "") label = undefined;
        setLabel(undefined);
        props.onSubmit(label);
    };

    const onCancel = () => {
        setLabel(undefined);
        props.onCancel()
    };

    const xPositionStyle = position[0] < window.innerWidth / 2 ?
        {left: position[0], right: "initial"} : {left: "initial", right: window.innerWidth - position[0]};
    const yPositionStyle = position[1] < window.innerHeight / 2 ?
        {top: position[1], bottom: "initial"} : {top: "initial", bottom: window.innerHeight - position[1]};

    return <ReactModal
        isOpen={props.position !== undefined}
        onRequestClose={onCancel}
        style={{
            overlay: { backgroundColor: "rgba(127, 127, 127, 0.35)" },
            content: {
                ...xPositionStyle,
                ...yPositionStyle
            }
        }}
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

    </ReactModal>

}