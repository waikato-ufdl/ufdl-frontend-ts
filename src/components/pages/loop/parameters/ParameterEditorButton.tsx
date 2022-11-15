import {FunctionComponentReturnType} from "../../../../util/react/types";
import useLocalModal from "../../../../util/react/hooks/useLocalModal";
import ParameterEditor from "./ParameterEditor";
import {ParameterSpec} from "./ParameterSpec";
import {ParameterValue} from "../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";

/**
 * Props to the {@link ParameterEditorButton} component.
 *
 * @property name
 *          The name of the parameter being edited.
 * @property parameterSpec
 *          The specification of the parameter being edited.
 * @property parameterValue
 *          The current value of the parameter, if any.
 * @property onParameterValueChanged
 *          Callback which receives the new value/type of the parameter when it is changed
 *          through the editing dialogue.
 */
export type ParameterEditorButtonProps = {
    parameterName: string,
    parameterSpec: ParameterSpec
    parameterValue: ParameterValue | undefined
    onParameterValueChanged: (parameterValue: any, parameterType: string) => void
}

/**
 * A button which activates a modal editing dialogue for a parameter when it is clicked.
 *
 * @param props
 *          The [props]{@link ParameterEditorButtonProps} to the component.
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
            {props.parameterName}{props.parameterValue !== undefined ? " ✓" : ""}
        </button>

        {/* The modal editing dialogue. */}
        <ParameterEditor
            onParameterValueChanged={
                (parameterValue, parameterType) => {
                    props.onParameterValueChanged(parameterValue, parameterType)
                    editorModal.hide()
                }
            }
            parameterSpec={props.parameterSpec}
            parameterValue={props.parameterValue}
            parameterName={props.parameterName}
            position={editorModal.position}
            onCancel={() => editorModal.hide()}
        />
    </>
}
