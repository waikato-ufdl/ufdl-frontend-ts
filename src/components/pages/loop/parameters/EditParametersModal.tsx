import {FunctionComponentReturnType} from "../../../../util/react/types";
import LocalModal from "../../../../util/react/component/LocalModal";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import ParameterEditorButton from "./ParameterEditorButton";
import {any} from "../../../../util/typescript/any";
import {ParameterValue} from "../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {useReducer} from "react";
import {ParameterSpec} from "./ParameterSpec";

/**
 * @property onDone
 *          What to do with the values that the user set for the parameters, once they are done editing them.
 * @property parameterSpecs
 *          The specifications of the parameters that the user can set values for.
 * @property position
 *          Where to display the modal on-screen.
 * @property onCancel
 *          What to do if the user decides to abort setting parameter values.
 */
export type EditParametersModalProps = {
    onDone: (
        parameter_values: { [parameter_name: string]: ParameterValue }
    ) => void
    parameterSpecs: { [parameter_name: string]: ParameterSpec }
    initialValues: { [parameter_name: string]: ParameterValue }
    position: [number, number] | undefined
    onCancel: () => void
}

/**
 * Modal dialogue which allows users to set the parameters of a job.
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

    // Use a reducer to merge newly-set parameter values into an overall mapping
    const [
        parameterValues,
        setParameterValue
    ] = useReducer(
        (
            prevState: { [parameter_name: string]: ParameterValue},
            action: [string, ParameterValue]
        ) => {
            // Clone the current mapping
            const newState = {...prevState}

            // Set/overwrite the parameter's value under the parameter's name in the mapping
            newState[action[0]] = action[1]

            return newState
        },
        props.initialValues
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

    // Create a list item for each parameter we are displaying which lets the user edit the parameter's value
    const parameterEditorButtonListItems = useDerivedState(
        ([
            requiredParameterSpecNames,
            namesOfAdditionalParametersToDisplay,
            parameterSpecs,
            parameterValues,
            setParameterValue
        ]) => {
            const items = []

            function setParameterValueActual(name: string, value: ParameterValue) {
                setParameterValue([name, value])
            }

            items.push(
                ...requiredParameterSpecNames.map(
                    name => parameterEditorButtonListItem(parameterSpecs, name, parameterValues, setParameterValueActual)
                )
            )

            items.push(
                ...namesOfAdditionalParametersToDisplay.map(
                    name => parameterEditorButtonListItem(parameterSpecs, name, parameterValues, setParameterValueActual)
                )
            )

            return items
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

function parameterEditorButtonListItem(
    parameterSpecs: { [parameter_name: string]: ParameterSpec },
    name: string,
    parameterValues: { [parameter_name: string]: ParameterValue },
    setParameterValue: (name: string, value: ParameterValue) => void
): JSX.Element {
    return <li>
        <ParameterEditorButton
            parameterSpec={parameterSpecs[name]}
            name={name}
            initial={parameterValues?.[name]}
            hasValue={parameterValues.hasOwnProperty(name)}
            onChange={(value, type) => setParameterValue(name, {value: value, type: type})}
        />
    </li>
}
