import {FunctionComponentReturnType} from "../../../util/react/types";
import LocalModal from "../../../util/react/component/LocalModal";
import {SelectFunction} from "../../../server/hooks/useImageClassificationDataset/actions/Select";
import {
    SELECT_ALL,
    SELECT_NONE,
    selectCorrect,
    selectIncorrect,
    selectLabel
} from "../../../server/hooks/useImageClassificationDataset/actions/SELECTIONS";
import {LabelColours} from "./labels/LabelColours";
import LabelSelect from "./labels/LabelSelect";
import {ImageClassificationDataset} from "../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";

export type SelectionModalProps = {
    position: [number, number] | undefined
    onSelect: (func: SelectFunction) => void
    onCancel: () => void,
    labels: LabelColours,
    evalDataset: ImageClassificationDataset | undefined
}

export default function SelectionModal(
    props: SelectionModalProps
): FunctionComponentReturnType {

    const onSelectActual = (func: SelectFunction) => {
        props.onSelect(func);
        props.onCancel();
    };

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <button onClick={() => onSelectActual(SELECT_ALL)}>
            All
        </button>
        <button onClick={() => onSelectActual(SELECT_NONE)}>
            None
        </button>
        <LabelSelect
            onRelabelled={(_, label) => {
                onSelectActual(selectLabel(label))
            }}
            label={undefined}
            labelColours={props.labels}
            allowSelectNone
        />
        <button
            disabled={props.evalDataset === undefined}
            onClick={() => onSelectActual(selectCorrect(props.evalDataset!))}
        >
            Correct
        </button>
        <button
            disabled={props.evalDataset === undefined}
            onClick={() => onSelectActual(selectIncorrect(props.evalDataset!))}
        >
            Incorrect
        </button>

    </LocalModal>

}