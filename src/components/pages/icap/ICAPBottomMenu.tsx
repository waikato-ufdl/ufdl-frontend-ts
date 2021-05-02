import React from "react";
import {Optional} from "ufdl-ts-client/util";
import PickLabelModal from "./labels/PickLabelModal";
import {LabelColours} from "./labels/LabelColours";
import {SORT_ORDERS, SortOrder} from "./sorting";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import {SelectFunction} from "../../../server/hooks/useImageClassificationDataset/actions/Select";
import SelectionModal from "./SelectionModal";
import {ImageClassificationDataset} from "../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";
import useLocalModal from "../../../util/react/hooks/useLocalModal";

export type ICAPBottomMenuProps = {
    onDeleteSelect: (() => void) | undefined
    onSelect: ((select: SelectFunction) => void) | undefined
    onRelabelSelected: ((label: Optional<string>) => void) | undefined
    onRequestLabelColourPickerOverlay: (() => void) | undefined
    onSortChanged: (order: SortOrder) => void
    labelColours: LabelColours
    evalDataset: ImageClassificationDataset | undefined
    numSelected: [number, number]
}

export default function ICAPBottomMenu(props: ICAPBottomMenuProps) {

    const labelModal = useLocalModal();

    const selectModal = useLocalModal();

    const [numSelected, outOf] = props.numSelected;

    return <div id={"ICAPBottomMenu"} className={"menuBar"}>
        <label>
            {`Selected (${numSelected}/${outOf}) `}
        </label>

        <button
            onClick={props.onDeleteSelect}
            disabled={props.onDeleteSelect === undefined}
        >
            Delete
        </button>

        <button
            onClick={selectModal.onClick}
            disabled={props.onSelect === undefined}
        >
            Select
        </button>

        <SelectionModal
            position={selectModal.position}
            onSelect={props.onSelect!}
            onCancel={selectModal.hide}
            labels={props.labelColours}
            evalDataset={props.evalDataset}
        />

        <button
            onClick={labelModal.onClick}
            disabled={props.onRelabelSelected === undefined}
        >
            Relabel
        </button>

        <PickLabelModal
            position={labelModal.position}
            onSubmit={props.onRelabelSelected!}
            onCancel={labelModal.hide}
            labelColours={props.labelColours}
            confirmText={"Relabel"}
        />

        <button
            onClick={props.onRequestLabelColourPickerOverlay}
            disabled={props.onRequestLabelColourPickerOverlay === undefined}
        >
            Labels...
        </button>

        <select
            onChange={asChangeEventHandler((order) => props.onSortChanged(order as SortOrder))}
        >
            {SORT_ORDERS.map(
                (order) => {
                    return <option
                        value={order}
                    >
                        {order}
                    </option>
                }
            )}

        </select>
    </div>

}