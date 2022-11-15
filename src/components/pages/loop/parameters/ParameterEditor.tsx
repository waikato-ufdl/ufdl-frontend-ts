import {FunctionComponentReturnType} from "../../../../util/react/types";
import LocalModal from "../../../../util/react/component/LocalModal";
import {ArraySelect} from "../../../../util/react/component/ArraySelect";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import Form from "@rjsf/core";
import {DEFAULT, WithDefault} from "../../../../util/typescript/default";
import {ParameterSpec} from "./ParameterSpec";
import useDerivedReducer from "../../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../../util/react/hooks/SimpleStateReducer";
import {ParameterValue} from "../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";

/**
 * The props to the {@link ParameterEditor} component.
 *
 * @property parameterName
 *          The name of the parameter being edited.
 * @property parameterSpec
 *          The specification of the parameter being edited.
 * @property parameterValue
 *          The current value of the parameter, if any.
 * @property onParameterValueChanged
 *          What to do when the value of this parameter is changed.
 * @property position
 *          Where to display the modal dialogue on screen.
 * @property onCancel
 *          What to do if the user aborts editing the parameter.
 */
export type ParameterEditorProps = {
    parameterName: string
    parameterSpec: ParameterSpec
    parameterValue: ParameterValue | undefined
    onParameterValueChanged: (parameterValue: any, parameterType: string) => void
    position: [number, number] | undefined
    onCancel: () => void
}

/**
 * Component for editing the value of a parameter to a job-template.
 *
 * @param props
 *          The [props]{@link ParameterEditorProps} to the component.
 */
export default function ParameterEditor(
    props: ParameterEditorProps
): FunctionComponentReturnType {

    // Get the specification of the parameter's default value
    const parameterDefaultSpec = props.parameterSpec.default

    // Create an array of the types that this parameter can take (including DEFAULT
    // to indicate the default type)
    const allowedTypeNames: WithDefault<string>[] = useDerivedState(
        ([parameterTypes, parameterDefaultSpec]) => {
            const allowedTypeNames: WithDefault<string>[] = []

            // If this parameter has a default, handle adding the default type to the array
            if (parameterDefaultSpec !== undefined) {
                // For constant parameters, the default type is the only allowed type
                if (parameterDefaultSpec.const) return [DEFAULT];

                // Otherwise add the default type as an option if it can't already be selected
                // from the declared types
                if (!(parameterDefaultSpec.type in parameterTypes))
                    allowedTypeNames.push(DEFAULT)
            }

            // Add all declared types to the array
            for (const parameterTypeName in parameterTypes) {
                allowedTypeNames.push(parameterTypeName as string)
            }

            return allowedTypeNames
        },
        [props.parameterSpec.types, parameterDefaultSpec] as const
    )

    // Create some state which tracks which type the user is specifying for the parameter
    const [selectedType, setSelectedType] = useDerivedReducer(
        createSimpleStateReducer<WithDefault<string>>(),
        ([parameterDefaultSpec, allowedTypeNames], currentState) => {
            if (currentState !== undefined && allowedTypeNames.indexOf(currentState) !== -1)
                return currentState
            else if (parameterDefaultSpec !== undefined && allowedTypeNames[0] !== DEFAULT)
                return parameterDefaultSpec.type
            else
                return allowedTypeNames[0]
        },
        [parameterDefaultSpec, allowedTypeNames] as const,
        () => props.parameterValue?.type
    )

    // Create a form which lets the user specify the value for the parameter according to the selected type
    const formElement = useDerivedState(
        ([selectedType, parameterTypes, parameterDefaultSpec, onParameterValueChanged, parameterValue]) => {
            // Get the schema of the selected type
            const schema = selectedType === DEFAULT
                ? parameterDefaultSpec!.schema
                : parameterTypes[selectedType]

            // Set the initial value of the form to the default value of the parameter
            // (if the default type is selected)
            const formData = parameterValue !== undefined
                ? parameterValue
                : parameterDefaultSpec !== undefined && (selectedType === DEFAULT || selectedType === parameterDefaultSpec.type)
                    ? parameterDefaultSpec.value
                    : undefined

            // Disable the form if a non-editable default type is selected
            const disabled = parameterDefaultSpec !== undefined && selectedType === DEFAULT

            // Get the actual name of the type to submit
            const submitType = selectedType !== DEFAULT
                ? selectedType
                : parameterDefaultSpec!.type as string

            return <div>
                <Form
                    schema={schema}
                    formData={formData}
                    disabled={disabled}
                    onSubmit={(e) => onParameterValueChanged(e.formData, submitType)}
                />
            </div>
        },
        [selectedType, props.parameterSpec.types, parameterDefaultSpec, props.onParameterValueChanged, props.parameterValue?.value] as const
    )

    return <LocalModal position={props.position} onCancel={props.onCancel}>
        <div>
            {/* Selector of what type of value to specify for the parameter. */}
            <ArraySelect<WithDefault<string>>
                disableFirstEmptyOption
                disabled={allowedTypeNames.length === 1}
                labelFunction={(value) => value === DEFAULT ? "Default" : value}
                values={allowedTypeNames}
                selected={allowedTypeNames.indexOf(selectedType)}
                onChange={(value) => {
                    if (value !== undefined) setSelectedType(value)
                }}
            />
        </div>

        {/* The form for editing the parameter value. */}
        {formElement}
    </LocalModal>
}
