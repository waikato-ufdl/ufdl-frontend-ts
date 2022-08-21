import React from "react";
import {FunctionComponentReturnType} from "../../util/react/types";
import {SELECTIONS} from "../hooks/useDataset/selection";
import {ItemSelectFragmentRenderer} from "./AnnotatorTopMenu";
import LocalModal from "../../util/react/component/LocalModal";
import useLocalModal from "../../util/react/hooks/useLocalModal";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../util/typescript/initialisers";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import {Data} from "../types/data";
import {DatasetDispatchItemSelector} from "../hooks/useDataset/types";

export type SelectionModalProps<D extends Data, A> = {
    position: [number, number] | undefined
    onSelect: (func: DatasetDispatchItemSelector<D, A>) => void
    onCancel: () => void
    itemSelectFragmentRenderer: ItemSelectFragmentRenderer<D, A>
    numItems: number
}

export default function SelectionModal<D extends Data, A>(
    props: SelectionModalProps<D, A>
): FunctionComponentReturnType {

    const randomAmountModal = useLocalModal()

    const [amount, setAmount] = useStateSafe(constantInitialiser(1))

    const onSelectActual = (func: DatasetDispatchItemSelector<D, A>) => {
        props.onSelect(func);
        props.onCancel();
        randomAmountModal.hide()
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
        <button onClick={randomAmountModal.onClick}>
            Random
        </button>
        <button onClick={() => onSelectActual(SELECTIONS.UNSELECTED)}>
            Invert
        </button>
        <LocalModal
            position={randomAmountModal.position}
            onCancel={randomAmountModal.hide}
        >
            <label>
                {`Number: ${amount} `}
                <input
                    type={"range"}
                    min={0}
                    max={props.numItems}
                    value={amount}
                    onChange={
                        asChangeEventHandler(
                            (amount) => setAmount(Number.parseInt(amount))
                        )
                    }
                />
            </label>
            <button onClick={
                () => {
                    onSelectActual(SELECTIONS.RANDOM_CHOOSE_M(amount))
                }
            }>
                Confirm
            </button>
        </LocalModal>
        {renderedItemSelectFragment}
    </LocalModal>
}
