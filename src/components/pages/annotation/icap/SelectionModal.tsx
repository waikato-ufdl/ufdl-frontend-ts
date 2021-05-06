import {FunctionComponentReturnType} from "../../../../util/react/types";
import LocalModal from "../../../../util/react/component/LocalModal";
import {
    selectClassification,
    selectCorrect,
    selectIncorrect
} from "../../../../server/hooks/useImageClassificationDataset/selection/selections";
import {SelectFunction} from "../../../../server/hooks/useDataset/selection/SelectFunction";
import {Image} from "../../../../server/types/data";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {Dataset} from "../../../../server/types/Dataset";
import {SELECT_ALL, SELECT_NONE} from "../../../../server/hooks/useDataset/selection/selections";
import {ClassColours} from "../../../../server/util/classification";
import ClassSelect from "../../../../server/components/classification/ClassSelect";

export type SelectionModalProps = {
    position: [number, number] | undefined
    onSelect: (func: SelectFunction<Image, Classification>) => void
    onCancel: () => void,
    classColours: ClassColours,
    evalDataset: Dataset<Image, Classification> | undefined
}

export default function SelectionModal(
    props: SelectionModalProps
): FunctionComponentReturnType {

    const onSelectActual = (func: SelectFunction<Image, Classification>) => {
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
        <ClassSelect
            onReclassify={(_, label) => {
                onSelectActual(selectClassification(label))
            }}
            classification={NO_CLASSIFICATION}
            colours={props.classColours}
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