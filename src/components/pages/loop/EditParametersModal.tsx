import {FunctionComponentReturnType} from "../../../util/react/types";
import LocalModal from "../../../util/react/component/LocalModal";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {ownPropertyIterator} from "../../../util/typescript/object";
import iteratorMap from "../../../util/typescript/iterate/map";
import iteratorConcat from "../../../util/typescript/iterate/concat";
import ParameterEditorButton from "./ParameterEditorButton";
import {any} from "../../../util/typescript/any";
import {ParameterValue} from "../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {Reducer, useReducer} from "react";

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
    parameter_specs: ParameterSpecs
    position: [number, number] | undefined
    onCancel: () => void
}

export default function EditParametersModal(
    props: EditParametersModalProps
): FunctionComponentReturnType {

    const [required_parameter_specs, optional_parameter_specs, const_parameter_specs] = useDerivedState(
        () => {
            const required_parameter_specs: ParameterSpecs = {}
            const optional_parameter_specs: ParameterSpecs = {}
            const const_parameter_specs: ParameterSpecs = {}

            for (const parameter_name in props.parameter_specs) {
                const spec = props.parameter_specs[parameter_name]
                if (spec.default === undefined)
                    required_parameter_specs[parameter_name] = spec
                else if (spec.default.const)
                    const_parameter_specs[parameter_name] = spec
                else
                    optional_parameter_specs[parameter_name] = spec
            }

            return [required_parameter_specs, optional_parameter_specs, const_parameter_specs]
        },
        [props.parameter_specs]
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
                    return [
                        ...iteratorMap(
                            ownPropertyIterator(optional_parameter_specs),
                            ([name, spec]) => <ParameterEditorButton
                                parameter_spec={spec}
                                name={name as string}
                                onChange={(value, type) => setValues([name as string, {value: value, type: type}])}
                            />
                        )
                    ]
                case "all":
                    return [
                        ...iteratorMap(
                            iteratorConcat(
                                ownPropertyIterator(optional_parameter_specs),
                                ownPropertyIterator(const_parameter_specs)
                            ),
                            ([name, spec]) => <ParameterEditorButton
                                parameter_spec={spec}
                                name={name as string}
                                onChange={(value, type) => setValues([name as string, {value: value, type: type}])}
                            />
                        )
                    ]
            }
        },
        [showExtra, optional_parameter_specs, const_parameter_specs]
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

    const parameter_list_items = useDerivedState(
        () => {
            return [
                ...iteratorMap(
                    ownPropertyIterator(required_parameter_specs),
                    ([name, spec]) => <ParameterEditorButton
                        parameter_spec={spec}
                        name={name as string}
                        onChange={(value, type) => setValues([name as string, { value: value, type: type}])}
                    />
                ),
                ...extra
            ]
        },
        [required_parameter_specs, extra]
    )

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <ul>
            {
                [
                    ...iteratorMap(
                        parameter_list_items[Symbol.iterator](),
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
                    ([required_parameter_name, _]) => {
                        const is_not_in = !(required_parameter_name in values)
                        console.log(required_parameter_name, is_not_in, values)
                        return is_not_in
                    },
                    ...ownPropertyIterator(required_parameter_specs)
                )
            }
        >
            Done
        </button>
    </LocalModal>
}
