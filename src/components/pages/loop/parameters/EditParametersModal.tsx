import {FunctionComponentReturnType} from "../../../../util/react/types/FunctionComponentReturnType";
import LocalModal from "../../../../util/react/component/LocalModal";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import ParameterEditorButton from "./ParameterEditorButton";
import {any} from "../../../../util/typescript/any";
import {ParameterValue} from "../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {ParameterSpec} from "./ParameterSpec";
import {ParameterValues} from "./ParameterValues";
import {Controllable, useControllableState} from "../../../../util/react/hooks/useControllableState";

/**
 * The props to the {@link EditParametersModal} component.
 *
 * @property onParameterValuesChanged
 *          Callback called when the user changes any parameter values.
 * @property onDone
 *          What to do with the values that the user set for the parameters, once they are done editing them.
 * @property parameterSpecs
 *          The specifications of the parameters that the user can set values for.
 * @property parameterValues
 *          A [controllable]{@link Controllable} prop for the current set of parameter values.
 * @property position
 *          Where to display the modal on-screen.
 * @property onCancel
 *          What to do if the user decides to abort setting parameter values.
 */
export type EditParametersModalProps = {
    onParameterValuesChanged: (parameterValues: ParameterValues) => void
    onDone: (parameterValues: ParameterValues) => void
    parameterSpecs: { [parameterName: string]: ParameterSpec }
    parameterValues: Controllable<ParameterValues>
    position: [number, number] | undefined
    onCancel: () => void
}

/**
 * Modal dialogue which allows users to set the parameters of a job.
 *
 * @param props
 *          The [props]{@link EditParametersModalProps} to the component.
 */
export default function EditParametersModal(
    props: EditParametersModalProps
): FunctionComponentReturnType {

    // Group the parameter names into required, optional, and constant sub-sets
    const [
        requiredParameterSpecNames,
        optionalParameterSpecNames,
        constParameterSpecNames
    ] = useDerivedState(
        ([parameterSpecs]) => {
            const requiredParameterSpecNames: string[] = []
            const optionalParameterSpecNames: string[] = []
            const constParameterSpecNames: string[] = []

            for (const parameterName in parameterSpecs) {
                const spec = parameterSpecs[parameterName]
                if (spec.default === undefined)
                    requiredParameterSpecNames.push(parameterName)
                else if (spec.default.const)
                    constParameterSpecNames.push(parameterName)
                else
                    optionalParameterSpecNames.push(parameterName)
            }

            return [requiredParameterSpecNames, optionalParameterSpecNames, constParameterSpecNames]
        },
        [props.parameterSpecs] as const
    )

    // Track the user's selection of which additional parameters to display. "none" just displays required
    // parameters, "optional" additionally displays optional parameters, and "all" additionally displays
    // const parameters
    const [
        additionalParametersToDisplay,
        setAdditionalParametersToDisplay
    ] = useStateSafe<"none" | "optional" | "all">(
        constantInitialiser("none")
    )

    // Calculate which additional parameters to display based on the user's selection
    const namesOfAdditionalParametersToDisplay = useDerivedState(
        ([showExtra, optionalParameterSpecs, constParameterSpecs]) => {
            switch (showExtra) {
                case "none":
                    return []
                case "optional":
                    return optionalParameterSpecs
                case "all":
                    return [
                        ...optionalParameterSpecs,
                        ...constParameterSpecs
                    ]
            }
        },
        [additionalParametersToDisplay, optionalParameterSpecNames, constParameterSpecNames] as const
    )

    // Track the controlled state of the parameter values
    const [parameterValues, setParameterValues] = useControllableState<ParameterValues>(props.parameterValues, () => { return {} })

    // Derive a function for setting a single parameter's value
    const setParameterValue = useDerivedState(
        ([parameterValues, setParameterValues, onParameterValuesChanged]) => {
            return (name: string, value: ParameterValue) => {
                // Clone the current mapping
                const newState = {...parameterValues}

                // Set/overwrite the parameter's value under the parameter's name in the mapping
                newState[name] = value

                setParameterValues(newState)
                onParameterValuesChanged(newState)
            }
        },
        [parameterValues, setParameterValues, props.onParameterValuesChanged] as const
    )

    // Derive some buttons which allow the user to change which additional parameters are displayed
    const changeAdditionalParametersButtons = useDerivedState(
        ([additionalParametersToDisplay, setAdditionalParametersToDisplay]) => {
            switch (additionalParametersToDisplay) {
                case "none":
                    return [
                        <button
                            onClick={() => setAdditionalParametersToDisplay("optional")}
                        >
                            Show Optional Parameters
                        </button>
                    ]
                case "optional":
                    return [
                        <button
                            onClick={() => setAdditionalParametersToDisplay("none")}
                        >
                            Hide Optional Parameters
                        </button>,
                        <button
                            onClick={() => setAdditionalParametersToDisplay("all")}
                        >
                            Show Constant Parameters
                        </button>
                    ]
                case "all":
                    return [
                        <button
                            onClick={() => setAdditionalParametersToDisplay("optional")}
                        >
                            Hide Constant Parameters
                        </button>
                    ]
            }
        },
        [additionalParametersToDisplay, setAdditionalParametersToDisplay] as const
    )

    // Create a button list item for each parameter we are displaying which lets the user edit the parameter's value
    const parameterEditorButtonListItems = useDerivedState(
        ([
            requiredParameterSpecNames,
            namesOfAdditionalParametersToDisplay,
            parameterSpecs,
            parameterValues,
            setParameterValue
        ]) => {
            const namesOfParametersToDisplay = [...requiredParameterSpecNames, ...namesOfAdditionalParametersToDisplay]

            return namesOfParametersToDisplay.map(
                name => <li>
                    <ParameterEditorButton
                        parameterSpec={parameterSpecs[name]}
                        parameterName={name}
                        parameterValue={parameterValues?.[name]}
                        onParameterValueChanged={(value, type) => setParameterValue(name, {value: value, type: type})}
                    />
                </li>
            )
        },
        [
            requiredParameterSpecNames,
            namesOfAdditionalParametersToDisplay,
            props.parameterSpecs,
            parameterValues,
            setParameterValue
        ] as const
    )

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        {/* The list of buttons which let the user edit the parameters. */}
        <ul>
            {parameterEditorButtonListItems}
        </ul>

        {/* The buttons which let the user hide/show optional/const parameters. */}
        {changeAdditionalParametersButtons}

        {/* Button which lets the user submit the values they have set for the parameters. */}
        <button
            onClick={() => {props.onDone(parameterValues)}}
            disabled={
                // The done button is disabled if any required parameter has not had its value set
                any(
                    requiredParameterName => !(requiredParameterName in parameterValues),
                    ...requiredParameterSpecNames
                )
            }
        >
            Done
        </button>
    </LocalModal>
}
