import {FunctionComponentReturnType} from "../../../util/react/types";
import {ParameterSpec} from "./EditParametersModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import ParameterEditor from "./ParameterEditor";

export type ParameterEditorButtonProps = {
    onChange: (parameter_value: any, parameter_type: string) => void
    parameter_spec: ParameterSpec,
    name: string,
    hasValue: boolean
}

export default function ParameterEditorButton(
    props: ParameterEditorButtonProps
): FunctionComponentReturnType {

    const editor_modal = useLocalModal();

    return <>
        <button
            title={props.parameter_spec.help}
            onClick={(event) => editor_modal.show(event.clientX, event.clientY)}
        >
            {props.name}{props.hasValue ? " ✓" : ""}
        </button>
        <ParameterEditor
            onChange={(parameter_value, parameter_type) => {props.onChange(parameter_value, parameter_type); editor_modal.hide()}}
            parameter_spec={props.parameter_spec}
            name={props.name}
            position={editor_modal.position}
            onCancel={() => editor_modal.hide()}
        />
    </>
}
