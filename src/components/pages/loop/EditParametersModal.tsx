import {FunctionComponentReturnType} from "../../../util/react/types";
import LocalModal from "../../../util/react/component/LocalModal";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import iteratorMap from "../../../util/typescript/iterate/map";
import iteratorConcat from "../../../util/typescript/iterate/concat";
import ParameterEditorButton from "./ParameterEditorButton";
import {any} from "../../../util/typescript/any";
import {ParameterValue} from "../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {Reducer, useReducer} from "react";
import iterate from "../../../util/typescript/iterate/iterate";

export type ParameterSpec = {
    types: { [type_string: string]: any}
    help: string
    default?: {
        value: any
        type: string
        schema: any
        const: boolean
    }
}

export type ParameterSpecs = { [name: string]: ParameterSpec }

export type ParameterValues = { [name: string]: ParameterValue}

export type EditParametersModalProps = {
    onDone: (parameter_values: ParameterValues) => void
    parameterSpecs: ParameterSpecs
    position: [number, number] | undefined
    onCancel: () => void
}

export default function EditParametersModal(
    props: EditParametersModalProps
): FunctionComponentReturnType {

    const [requiredParameterSpecs, optionalParameterSpecs, constParameterSpecs] = useDerivedState(
        () => {
            const requiredParameterSpecs: string[] = []
            const optionalParameterSpecs: string[] = []
            const constParameterSpecs: string[] = []

            for (const parameterName in props.parameterSpecs) {
                const spec = props.parameterSpecs[parameterName]
                if (spec.default === undefined)
                    requiredParameterSpecs.push(parameterName)
                else if (spec.default.const)
                    constParameterSpecs.push(parameterName)
                else
                    optionalParameterSpecs.push(parameterName)
            }

            return [requiredParameterSpecs, optionalParameterSpecs, constParameterSpecs]
        },
        [props.parameterSpecs]
    )

    const [showExtra, setShowExtra] = useStateSafe<"none" | "optional" | "all">(constantInitialiser("none"))

    const [values, setValues] = useReducer<Reducer<ParameterValues, [string, ParameterValue]>>(
        (prevState, action) => {
            const newState = {...prevState}
            newState[action[0]] = action[1]
            return newState
        },
        {}
    )

    const extra = useDerivedState(
        () => {
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
        [showExtra, optionalParameterSpecs, constParameterSpecs]
    )

    const buttons = useDerivedState(
        () => {
            switch (showExtra) {
                case "none":
                    return [
                        <button
                            onClick={() => setShowExtra("optional")}
                        >
                            Show Optional Parameters
                        </button>
                    ]
                case "optional":
                    return [
                        <button
                            onClick={() => setShowExtra("none")}
                        >
                            Hide Optional Parameters
                        </button>,
                        <button
                            onClick={() => setShowExtra("all")}
                        >
                            Show Constant Parameters
                        </button>
                    ]
                case "all":
                    return [
                        <button
                            onClick={() => setShowExtra("optional")}
                        >
                            Hide Constant Parameters
                        </button>
                    ]
            }
        },
        [showExtra]
    )

    const parameterListItems = useDerivedState(
        () => {
            return [
                ...iteratorMap(
                    iteratorConcat(
                        iterate(requiredParameterSpecs),
                        iterate(extra)
                    ),
                    (name) => {
                        return <ParameterEditorButton
                            parameterSpec={props.parameterSpecs[name]}
                            name={name as string}
                            hasValue={values.hasOwnProperty(name)}
                            onChange={(value, type) => setValues([name as string, {value: value, type: type}])}
                        />
                    }
                )
            ]
        },
        [requiredParameterSpecs, extra, values]
    )

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <ul>
            {
                [
                    ...iteratorMap(
                        parameterListItems[Symbol.iterator](),
                        (editor) => <li>{editor}</li>
                    )
                ]
            }
        </ul>
        {buttons}
        <button
            onClick={() => {props.onDone(values)}}
            disabled={
                any(
                    (requiredParameterName) => {
                        const requiredParameterValueNotSet = !(requiredParameterName in values)
                        console.log(requiredParameterName, requiredParameterValueNotSet, values)
                        return requiredParameterValueNotSet
                    },
                    ...requiredParameterSpecs
                )
            }
        >
            Done
        </button>
    </LocalModal>
}
