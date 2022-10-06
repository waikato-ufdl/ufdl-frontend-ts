import {FunctionComponentReturnType} from "../types";
import {Controllable, useControllableState} from "../hooks/useControllableState";
import useDerivedState from "../hooks/useDerivedState";
import iteratorMap from "../../typescript/iterate/map";

export type InterlatchedCheckboxesProps<
    Options extends readonly [unknown, ...unknown[]]
> = {
    options: Options
    labelExtractor: (option: Options[number], index: number, options: Options) => string
    canSelectNone: boolean
    selected: Controllable<number>
    onChanged: (
        option: Options[number] | undefined,
        index: number | undefined,
        options: Options
    ) => void
}

export default function InterlatchedCheckboxes<
    Options extends readonly [unknown, ...unknown[]]
>(
    props: InterlatchedCheckboxesProps<Options>
): FunctionComponentReturnType {

    const [selected, setSelected] = useControllableState<number | undefined>(
        props.selected,
        () => props.canSelectNone ? undefined : 0
    )

    const setSelectedNotify = useDerivedState(
        ([setSelected, onChanged, options]) =>
            (index: number | undefined) => {
                setSelected(index)
                onChanged(index !== undefined ? options[index] : undefined, index, options)
            },
        [setSelected, props.onChanged, props.options] as const
    )

    // If an invalid option index is selected, this is equivalent to selecting no option if
    // props.canSelectNone is true, or selecting the first option if false
    const normalisedSelected =
        selected !== undefined && Number.isInteger(selected) && selected >= 0 && selected < props.options.length
            ? selected
            : props.canSelectNone
                ? -1
                : 0

    const checkboxes = [
        ...iteratorMap(
            props.options.entries(),
            ([index, option]) => {
                const checked = index === normalisedSelected
                return <label>
                    {props.labelExtractor(option, index, props.options)}
                    <input
                        className={"InterlatchedCheckbox"}
                        type={"checkbox"}
                        checked={checked}
                        onChange={() => {
                            if (checked) {
                                if (props.canSelectNone) setSelectedNotify(undefined)
                            } else {
                                setSelectedNotify(index)
                            }
                        }}
                    />
                </label>
            }
        )
    ]

    return <div className={"InterlatchedCheckboxes"}>
        {checkboxes}
    </div>

}