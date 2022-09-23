import {FunctionComponentReturnType} from "../../../../util/react/types";
import useLocalModal from "../../../../util/react/hooks/useLocalModal";
import ParameterEditor from "./ParameterEditor";
import {ParameterSpec} from "./ParameterSpec";
import {ParameterValue} from "../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";

/**
 * @property onChange
 *          Function which receive the new value/type of the parameter when it changes.
 * @property parameterSpec
 *          The specification of the parameter being edited.
 * @property name
 *          The name of the parameter being edited.
 * @property hasValue
 *          Whether a value for this parameter has already been set.
 */
export type ParameterEditorButtonProps = {
    onChange: (parameter_value: any, parameter_type: string) => void
    parameterSpec: ParameterSpec
    initial: ParameterValue | undefined
    name: string,
    hasValue: boolean
}

/**
 * A button which activates a modal editing dialogue for a parameter when it is clicked.
 */
export default function ParameterEditorButton(
    props: ParameterEditorButtonProps
): FunctionComponentReturnType {

    const editorModal = useLocalModal();

    return <>
        {/* The button itself, which activates the modal editing dialogue. */}
        <button
            title={props.parameterSpec.help}
            onClick={(event) => editorModal.show(event.clientX, event.clientY)}
        >
            {props.name}{props.hasValue ? " ✓" : ""}
        </button>

        {/* The modal editing dialogue. */}
        <ParameterEditor
            onChange={
                (parameterValue, parameterType) => {
                    props.onChange(parameterValue, parameterType)
                    editorModal.hide()
                }
            }
            parameterSpec={props.parameterSpec}
            initial={props.initial}
            name={props.name}
            position={editorModal.position}
            onCancel={() => editorModal.hide()}
        />
    </>
}
