import React from "react";
import asChangeEventHandler from "../../../../util/react/asChangeEventHandler";
import SelectionModal from "./SelectionModal";
import useLocalModal from "../../../../util/react/hooks/useLocalModal";
import {ItemSelector} from "../../../../server/hooks/useDataset/selection";
import {Image} from "../../../../server/types/data";
import {Classification} from "../../../../server/types/annotations";
import {Dataset} from "../../../../server/types/Dataset";
import {ClassColours} from "../../../../server/util/classification";
import LocalModal from "../../../../util/react/component/LocalModal";
import PickClassForm from "../../../../server/components/classification/PickClassForm";
import {BY_FILENAME} from "../../../../server/sorting";
import {BY_CLASSIFICATION} from "../../../../server/components/classification/sorting";

export const SORT_ORDERS = {
    "filename": BY_FILENAME,
    "label": BY_CLASSIFICATION
} as const

export type ICAPBottomMenuProps = {
    onDeleteSelect: (() => void) | undefined
    onSelect: ((select: ItemSelector<Image, Classification>) => void) | undefined
    onRelabelSelected: ((label: Classification) => void) | undefined
    onRequestLabelColourPickerOverlay: (() => void) | undefined
    onSortChanged: (order: keyof typeof SORT_ORDERS) => void
    colours: ClassColours
    evalDataset: Dataset<Image, Classification> | undefined
    numSelected: [number, number]
}

export default function ICAPBottomMenu(
    props: ICAPBottomMenuProps
) {

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
            classColours={props.colours}
            evalDataset={props.evalDataset}
        />

        <button
            onClick={labelModal.onClick}
            disabled={props.onRelabelSelected === undefined}
        >
            Relabel
        </button>

        <LocalModal
            position={labelModal.position}
            onCancel={labelModal.hide}
        >
            <PickClassForm
                onSubmit={props.onRelabelSelected!}
                colours={props.colours}
                confirmText={"Relabel"}
            />
        </LocalModal>

        <button
            onClick={props.onRequestLabelColourPickerOverlay}
            disabled={props.onRequestLabelColourPickerOverlay === undefined}
        >
            Labels...
        </button>

        <select
            onChange={asChangeEventHandler((order) => props.onSortChanged(order as keyof typeof SORT_ORDERS))}
        >
            {Object.getOwnPropertyNames(SORT_ORDERS).map(
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