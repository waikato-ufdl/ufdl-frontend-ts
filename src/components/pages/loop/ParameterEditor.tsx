import {FunctionComponentReturnType} from "../../../util/react/types";
import {ParameterSpec} from "./EditParametersModal";
import LocalModal from "../../../util/react/component/LocalModal";
import {ArraySelect} from "../../../util/react/component/ArraySelect";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {ownPropertyIterator} from "../../../util/typescript/object";
import iteratorMap from "../../../util/typescript/iterate/map";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {Absent} from "../../../util/typescript/types/Possible";
import Form from "@rjsf/core";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";

export type ParameterEditorProps = {
    onChange: (parameter_value: any, parameter_type: string) => void
    parameterSpec: ParameterSpec
    name: string
    position: [number, number] | undefined
    onCancel: () => void
}

export default function ParameterEditor(
    props: ParameterEditorProps
): FunctionComponentReturnType {
    const def = props.parameterSpec.default

    const types = useDerivedState<WithDefault<string>[], any>(
        () => {
            let types: WithDefault<string>[] = []

            if (def !== undefined) {
                if (def.const) return [DEFAULT];
                console.log(props.parameterSpec.types, def.type, !(def.type in props.parameterSpec.types))
                if (!(def.type in props.parameterSpec.types))
                    types.push(DEFAULT)
            }

            types.push(
                ...iteratorMap(
                    ownPropertyIterator(props.parameterSpec.types),
                    ([type_name]) => type_name as string
                )
            )

            return types
        },
        [props.parameterSpec.types, def]
    )

    const [selectedIndex, setSelectedIndex] = useStateSafe<number>(() => {
        if (def !== undefined && types[0] !== DEFAULT)
            return types.indexOf(def.type)
        else
            return 0
    })

    const form_element = useDerivedState(
        () => {
            const type = types[selectedIndex]
            const schema = type === DEFAULT
                ? def?.schema
                : props.parameterSpec.types[type]

            const formData = def !== undefined
                ? type === DEFAULT || type === def.type
                    ? def.value
                    : undefined
                : undefined;

            const disabled = def !== undefined && type === DEFAULT

            const submitType = type !== DEFAULT
                ? type
                : def?.type as string

            return <div>
                <Form
                    schema={schema}
                    formData={formData}
                    disabled={disabled}
                    onSubmit={(e) => {
                        console.log(e.formData)
                        props.onChange(
                            e.formData,
                            submitType
                        )
                    }}
                />
            </div>
        },
        [selectedIndex, props.parameterSpec.types, props.parameterSpec.default]
    )

    return <LocalModal position={props.position} onCancel={props.onCancel}>
        <div>
            <ArraySelect<WithDefault<string>[]>
                disableFirstEmptyOption
                disabled={types.length === 1}
                labelFunction={(value) => value === DEFAULT ? "Default" : value}
                values={types}
                value={selectedIndex}
                onChange={(value, index) => {
                    if (value !== Absent)
                        setSelectedIndex(index)
                }}
            />
        </div>
        {form_element}
    </LocalModal>
}
