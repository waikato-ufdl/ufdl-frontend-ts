import {FunctionComponentReturnType} from "../../../util/react/types";
import {ParameterSpec} from "./EditParametersModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import ParameterEditor from "./ParameterEditor";

export type ParameterEditorButtonProps = {
    onChange: (parameter_value: any, parameter_type: string) => void
    parameterSpec: ParameterSpec,
    name: string,
    hasValue: boolean
}

export default function ParameterEditorButton(
    props: ParameterEditorButtonProps
): FunctionComponentReturnType {

    const editorModal = useLocalModal();

    return <>
        <button
            title={props.parameterSpec.help}
            onClick={(event) => editorModal.show(event.clientX, event.clientY)}
        >
            {props.name}{props.hasValue ? " ✓" : ""}
        </button>
        <ParameterEditor
            onChange={
                (parameterValue, parameterType) => {
                    props.onChange(parameterValue, parameterType)
                    editorModal.hide()
                }
            }
            parameterSpec={props.parameterSpec}
            name={props.name}
            position={editorModal.position}
            onCancel={() => editorModal.hide()}
        />
    </>
}
