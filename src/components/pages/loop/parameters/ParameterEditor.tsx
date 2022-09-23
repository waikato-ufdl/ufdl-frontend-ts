import {FunctionComponentReturnType} from "../../../../util/react/types";
import LocalModal from "../../../../util/react/component/LocalModal";
import {ArraySelect} from "../../../../util/react/component/ArraySelect";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {Absent} from "../../../../util/typescript/types/Possible";
import Form from "@rjsf/core";
import {DEFAULT, WithDefault} from "../../../../util/typescript/default";
import {ParameterSpec} from "./ParameterSpec";
import useDerivedReducer from "../../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../../util/react/hooks/SimpleStateReducer";
import {ParameterValue} from "../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";

/**
 * @property onChange
 *          What to do when the value of this parameter is changed.
 * @property parameterSpec
 *          The specification of the parameter being edited.
 * @property name
 *          The name of the parameter being edited.
 * @property position
 *          Where to display the modal dialogue on screen.
 * @property onCancel
 *          What to do if the user aborts editing the parameter.
 */
export type ParameterEditorProps = {
    onChange: (parameter_value: any, parameter_type: string) => void
    parameterSpec: ParameterSpec
    initial: ParameterValue | undefined
    name: string
    position: [number, number] | undefined
    onCancel: () => void
}

/**
 * Modal dialogue for editing the value of a parameter to a job-template.
 */
export default function ParameterEditor(
    props: ParameterEditorProps
): FunctionComponentReturnType {

    const parameterDefaultSpec = props.parameterSpec.default

    // Create an array of the types that this parameter can take (including DEFAULT
    // to indicate the default type)
    const allowedTypeNames: WithDefault<string>[] = useDerivedState(
        ([parameterTypes, parameterDefaultSpec]) => {
            let allowedTypeNames: WithDefault<string>[] = []

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
        () => props.initial?.type
    )

    // Create a form which lets the user specify the value for the parameter according to the selected type
    const formElement = useDerivedState(
        ([selectedType, parameterTypes, parameterDefaultSpec, onChange, initial]) => {
            // Get the schema of the selected type
            const schema = selectedType === DEFAULT
                ? parameterDefaultSpec!.schema
                : parameterTypes[selectedType]

            // Set the initial value of the form to the default value of the parameter
            // (if the default type is selected)
            const formData = initial !== undefined
                ? initial
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
                    onSubmit={(e) => onChange(e.formData, submitType)}
                />
            </div>
        },
        [selectedType, props.parameterSpec.types, props.parameterSpec.default, props.onChange, props.initial?.value] as const
    )

    return <LocalModal position={props.position} onCancel={props.onCancel}>
        <div>
            {/* Selector of what type of value to specify for the parameter. */}
            <ArraySelect<WithDefault<string>[]>
                disableFirstEmptyOption
                disabled={allowedTypeNames.length === 1}
                labelFunction={(value) => value === DEFAULT ? "Default" : value}
                values={allowedTypeNames}
                value={allowedTypeNames.indexOf(selectedType)}
                onChange={(value) => {
                    if (value !== Absent)
                        setSelectedType(value)
                }}
            />
        </div>

        {/* The form for editing the parameter value. */}
        {formElement}
    </LocalModal>
}
