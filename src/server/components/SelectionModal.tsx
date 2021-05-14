import React from "react";
import {FunctionComponentReturnType} from "../../util/react/types";
import {ItemSelector, SELECTIONS} from "../hooks/useDataset/selection";
import {ItemSelectFragmentRenderer} from "./AnnotatorTopMenu";
import LocalModal from "../../util/react/component/LocalModal";

export type SelectionModalProps<D, A> = {
    position: [number, number] | undefined
    onSelect: (func: ItemSelector<D, A>) => void
    onCancel: () => void
    itemSelectFragmentRenderer: ItemSelectFragmentRenderer<D, A>
}

export default function SelectionModal<D, A>(
    props: SelectionModalProps<D, A>
): FunctionComponentReturnType {

    const onSelectActual = (func: ItemSelector<D, A>) => {
        props.onSelect(func);
        props.onCancel();
    };

    const renderedItemSelectFragment = props.itemSelectFragmentRenderer(onSelectActual);

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <button onClick={() => onSelectActual(SELECTIONS.ALL)}>
            All
        </button>
        <button onClick={() => onSelectActual(SELECTIONS.NONE)}>
            None
        </button>
        {renderedItemSelectFragment}
    </LocalModal>
}
