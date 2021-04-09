import React from "react";
import {Optional} from "ufdl-ts-client/util";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import PickLabelModal from "./labels/PickLabelModal";
import {LabelColours} from "./labels/LabelColours";
import {SORT_ORDERS, SortOrder} from "./sorting";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import {SelectFunction} from "../../../server/hooks/useImageClassificationDataset/actions/Select";
import SelectionModal from "./SelectionModal";
import {ImageClassificationDataset} from "../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";

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

    const [labelModal, setLabelModal] = useStateSafe<[number, number] | undefined>(
        constantInitialiser(undefined)
    );

    const [selectModal, setSelectModal] = useStateSafe<[number, number] | undefined>(
        constantInitialiser(undefined)
    );

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
            onClick={(event) => setSelectModal([event.clientX, event.clientY])}
            disabled={props.onSelect === undefined}
        >
            Select
        </button>

        <SelectionModal
            position={selectModal}
            onSelect={props.onSelect!}
            onCancel={() => setSelectModal(undefined)}
            labels={props.labelColours}
            evalDataset={props.evalDataset}
        />

        <button
            onClick={(event) => setLabelModal([event.clientX, event.clientY])}
            disabled={props.onRelabelSelected === undefined}
        >
            Relabel
        </button>

        <PickLabelModal
            position={labelModal}
            onSubmit={props.onRelabelSelected!}
            onCancel={() => setLabelModal(undefined)}
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