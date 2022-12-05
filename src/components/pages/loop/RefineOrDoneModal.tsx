import {FunctionComponentReturnType} from "../../../util/react/types/FunctionComponentReturnType";
import LocalModal from "../../../util/react/component/LocalModal";

export type RefineOrDoneModalProps = {
    onRefine: () => void
    onDone: () => void
    position: [number, number] | undefined
    onCancel: () => void
}

export default function RefineOrDoneModal(
    props: RefineOrDoneModalProps
): FunctionComponentReturnType {
    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <button onClick={props.onRefine}>Refine</button>
        <button onClick={props.onDone}>Done</button>
    </LocalModal>
}
