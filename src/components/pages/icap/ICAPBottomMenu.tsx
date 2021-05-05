import React from "react";
import {SORT_ORDERS, SortOrder} from "./sorting";
import asChangeEventHandler from "../../../util/react/asChangeEventHandler";
import SelectionModal from "./SelectionModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {SelectFunction} from "../../../server/hooks/useDataset/selection/SelectFunction";
import {Image} from "../../../server/types/data";
import {Classification} from "../../../server/types/annotations";
import {Dataset} from "../../../server/types/Dataset";
import {ClassColours} from "../../../server/util/classification";
import PickClassModal from "../../../server/components/classification/PickClassModal";

export type ICAPBottomMenuProps = {
    onDeleteSelect: (() => void) | undefined
    onSelect: ((select: SelectFunction<Image, Classification>) => void) | undefined
    onRelabelSelected: ((label: Classification) => void) | undefined
    onRequestLabelColourPickerOverlay: (() => void) | undefined
    onSortChanged: (order: SortOrder) => void
    colours: ClassColours
    evalDataset: Dataset<Image, Classification> | undefined
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
            classColours={props.colours}
            evalDataset={props.evalDataset}
        />

        <button
            onClick={labelModal.onClick}
            disabled={props.onRelabelSelected === undefined}
        >
            Relabel
        </button>

        <PickClassModal
            position={labelModal.position}
            onSubmit={props.onRelabelSelected!}
            onCancel={labelModal.hide}
            colours={props.colours}
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