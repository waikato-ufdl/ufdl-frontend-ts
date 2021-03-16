import React from "react";
import callOrPass from "../../../util/typescript/callOrPass";
import {Optional} from "ufdl-js-client/util";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import PickLabelModal from "./labels/PickLabelModal";
import {LabelColours} from "./labels/LabelColours";

export type ICAPBottomMenuProps = {
    onDeleteSelect: (() => void) | undefined
    onSelectAll: ((select: boolean) => void) | undefined
    onRelabelSelected: ((label: Optional<string>) => void) | undefined
    onRequestLabelColourPickerOverlay: (() => void) | undefined
    labelColours: LabelColours
}

export default function ICAPBottomMenu(props: ICAPBottomMenuProps) {

    const [modal, setModal] = useStateSafe<[number, number] | undefined>(constantInitialiser(undefined));

    return <div id={"ICAPBottomMenu"} className={"menuBar"}>
        <label>
            Selected
        </label>

        <button
            onClick={props.onDeleteSelect}
            disabled={props.onDeleteSelect === undefined}
        >
            Delete
        </button>

        <button
            onClick={() => callOrPass(props.onSelectAll)(true)}
            disabled={props.onSelectAll === undefined}
        >
            Select All
        </button>

        <button
            onClick={() => callOrPass(props.onSelectAll)(false)}
            disabled={props.onSelectAll === undefined}
        >
            Clear All
        </button>

        <button
            onClick={(event) => setModal([event.clientX, event.clientY])}
            disabled={props.onRelabelSelected === undefined}
        >
            Relabel
        </button>

        <PickLabelModal
            position={modal}
            onSubmit={props.onRelabelSelected!}
            onCancel={() => setModal(undefined)}
            labelColours={props.labelColours}
        />

        <button
            onClick={props.onRequestLabelColourPickerOverlay}
            disabled={props.onRequestLabelColourPickerOverlay === undefined}
        >
            Labels...
        </button>
    </div>

}