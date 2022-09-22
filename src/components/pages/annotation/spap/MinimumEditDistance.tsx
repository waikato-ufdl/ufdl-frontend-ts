import {FunctionComponentReturnType} from "../../../../util/react/types";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import UNREACHABLE from "../../../../util/typescript/UNREACHABLE";
import "./MinimumEditDistance.css"
import {MultiKeyMap} from "../../../../util/typescript/datastructures/MultiKeyMap";

export type MinimumEditDistanceProps = {
    targetString: string,
    startingString: string
}

export default function MinimumEditDistance(
    props: MinimumEditDistanceProps
): FunctionComponentReturnType {

    const edit_list = useDerivedState(
        ([targetString, startingString]) => {
            const expanded = minimum_edit_list(startingString, targetString)

            return expanded.reduce(
                (compact, edit) => {
                    if (compact.length === 0) return [{...edit}]
                    const last = compact.slice(-1)[0]
                    if (last.type === edit.type) {
                        last.char += edit.char
                        if (last.type === "replace") last.orig += (edit as Replace).orig
                        return compact
                    }
                    return [...compact, {...edit}]
                },
                [] as Edit[]
            )
        },
        [props.targetString, props.startingString] as const
    )

    const spans = edit_list.map(
        edit => {
            switch (edit.type) {
                case "pass":
                    return <span>{edit.char}</span>
                case "insert":
                    return <span className={"med-insert"}>{edit.char}</span>
                case "delete":
                    return <span className={"med-delete"}>{edit.char}</span>
                case "replace":
                    return <><span className={"med-replace-delete"}>{edit.orig}</span><span className={"med-replace-insert"}>{edit.char}</span></>
                default:
                    return UNREACHABLE("All switch cases handled")
            }
        }
    )

    return <>
        {spans}
    </>


}

type Insert = {
    type: "insert"
    char: string
}

type Delete = {
    type: "delete"
    char: string
}

type Replace = {
    type: "replace"
    orig: string
    char: string
}

type Pass = {
    type: "pass"
    char: string
}

type Edit = Insert | Delete | Replace | Pass

function minimum_edit_list(
    startingString: string,
    targetString: string,
    memo: MultiKeyMap<readonly [number, number], readonly Edit[]> = new MultiKeyMap()
): readonly Edit[] {
    const string_pair = [startingString.length, targetString.length] as const
    const memoed = memo.get(string_pair)
    if (memoed !== undefined) return memoed

    let result: readonly Edit[]
    if (startingString.length === 0)
        result = targetString.split("").map(char => { return { type: "insert", char }})
    else if (targetString.length === 0)
        result = startingString.split("").map(char => { return { type: "delete", char }})
    else {
        const starting_string_less_one = startingString.slice(0, -1)
        const starting_string_last = startingString.slice(-1)
        const target_string_less_one = targetString.slice(0, -1)
        const target_string_last = targetString.slice(-1)

        const insert_list = minimum_edit_list(startingString, target_string_less_one, memo).concat({type: "insert", char: target_string_last})
        const delete_list = minimum_edit_list(starting_string_less_one, targetString, memo).concat({type: "delete", char: starting_string_last})
        const replace_or_pass_list = minimum_edit_list(starting_string_less_one, target_string_less_one, memo).concat(
            starting_string_last === target_string_last?
                {type: "pass", char: starting_string_last}
                :{type: "replace", char: target_string_last, orig: starting_string_last}
        )

        result = [insert_list, delete_list, replace_or_pass_list].map(
            list => [list, minimum_edit_distance(list)] as const
        ).reduce(
            (min_list, next_list) => next_list[1] < min_list[1] ? next_list : min_list
        )[0]
    }

    memo.set(string_pair, result)

    return result
}

function minimum_edit_distance(
    list: Edit[]
): number {
    let sum = 0
    for (const edit of list) {
        switch (edit.type) {
            case "insert":
            case "delete":
            case "replace":
                sum += 1
                break;
            case "pass":
                break
        }
    }
    return sum
}