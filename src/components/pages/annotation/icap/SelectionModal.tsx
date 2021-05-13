import {FunctionComponentReturnType} from "../../../../util/react/types";
import LocalModal from "../../../../util/react/component/LocalModal";
import {Image} from "../../../../server/types/data";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {Dataset} from "../../../../server/types/Dataset";
import {ClassColours} from "../../../../server/util/classification";
import ClassSelect from "../../../../server/components/classification/ClassSelect";
import {ItemSelector} from "../../../../server/hooks/useDataset/selection";
import {IC_SELECTIONS} from "../../../../server/hooks/useImageClassificationDataset/selection";

export type SelectionModalProps = {
    position: [number, number] | undefined
    onSelect: (func: ItemSelector<Image, Classification>) => void
    onCancel: () => void,
    classColours: ClassColours,
    evalDataset: Dataset<Image, Classification> | undefined
}

export default function SelectionModal(
    props: SelectionModalProps
): FunctionComponentReturnType {

    const onSelectActual = (func: ItemSelector<Image, Classification>) => {
        props.onSelect(func);
        props.onCancel();
    };

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <button onClick={() => onSelectActual(IC_SELECTIONS.ALL)}>
            All
        </button>
        <button onClick={() => onSelectActual(IC_SELECTIONS.NONE)}>
            None
        </button>
        <ClassSelect
            onReclassify={(_, classification) => {
                onSelectActual(IC_SELECTIONS.withClassification(classification))
            }}
            classification={NO_CLASSIFICATION}
            colours={props.classColours}
            allowSelectNone
        />
        <button
            disabled={props.evalDataset === undefined}
            onClick={() => onSelectActual(IC_SELECTIONS.correctForEval(props.evalDataset!))}
        >
            Correct
        </button>
        <button
            disabled={props.evalDataset === undefined}
            onClick={() => onSelectActual(IC_SELECTIONS.incorrectForEval(props.evalDataset!))}
        >
            Incorrect
        </button>

    </LocalModal>

}