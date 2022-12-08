import {FunctionComponentReturnType} from "../../../util/react/types/FunctionComponentReturnType";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import UNREACHABLE from "../../../util/typescript/UNREACHABLE";
import "./MinimumEditDistance.css"
import {MultiKeyMap} from "../../../util/typescript/datastructures/MultiKeyMap";
import {MouseEvent, MouseEventHandler} from "react";
import {augmentClassName} from "../../../util/react/augmentClass";

export type MinimumEditDistanceProps = {
    className?: string
    targetString: string,
    startingString: string,
    onClick?: (
        edit: Edit,
        event: MouseEvent<HTMLSpanElement>
    ) => void
}

export default function MinimumEditDistance(
    props: MinimumEditDistanceProps
): FunctionComponentReturnType {

    const edits = useDerivedState(
        ([targetString, startingString]) =>
            calculateMinimumEdits(
                startingString,
                targetString
            ),
        [props.targetString, props.startingString] as const
    )

    const onClick: ((edit: Edit) => MouseEventHandler<HTMLSpanElement>) | undefined = useDerivedState(
        ([onClick]) => onClick === undefined
            ? undefined
            : edit => event => onClick(edit, event),
        [props.onClick] as const
    )

    const spans = edits.map(
        edit => {
            switch (edit.type) {
                case "pass":
                    return <span onClick={onClick?.(edit)} className={"med-pass"}>{edit.string}</span>
                case "insert":
                    return <span onClick={onClick?.(edit)} className={"med-insert"}>{edit.string}</span>
                case "delete":
                    return <span onClick={onClick?.(edit)} className={"med-delete"}>{edit.string}</span>
                case "replace":
                    return <>
                        <span onClick={onClick?.(edit)} className={"med-replace-delete"}>{edit.original}</span>
                        <span onClick={onClick?.(edit)} className={"med-replace-insert"}>{edit.string}</span>
                    </>
                default:
                    return UNREACHABLE("All switch cases handled")
            }
        }
    )

    return <div className={augmentClassName(props.className, "MinimumEditDistance")}>
        {spans}
    </div>


}

type Insert = {
    readonly type: "insert"
    readonly string: string
}

type Delete = {
    readonly type: "delete"
    readonly string: string
}

type Replace = {
    readonly type: "replace"
    readonly original: string
    readonly string: string
}

type Pass = {
    readonly type: "pass"
    readonly string: string
}

type Edit = Insert | Delete | Replace | Pass

function calculateMinimumEdits(
    startingString: string,
    targetString: string,
    insertWeight: ((string: string) => number) | number = string => string.length,
    deleteWeight: ((string: string) => number) | number = string => string.length,
    replaceWeight: ((original: string, string: string) => number) | number = (original, string) => Math.max(original.length, string.length),
    memo: MultiKeyMap<readonly [number, number], readonly Edit[]> = new MultiKeyMap()
): readonly Edit[] {
    // Check if we have already memo-ed this pair of strings
    const memoKey = [startingString.length, targetString.length] as const
    const memoed = memo.get(memoKey)
    if (memoed !== undefined) return memoed

    // Create a function which handles forwarding arguments to recursive calls
    function recurse(newStartingString: string, newTargetString: string): readonly Edit[] {
        return calculateMinimumEdits(
            newStartingString,
            newTargetString,
            insertWeight, deleteWeight, replaceWeight,
            memo
        )
    }

    // Create a function which uses the reducer to produce a reduced version of a given edit-list
    function reduceToMinimumWeight(edits: Edit[]): Edit[] {
        while (edits.length >= 2) {
            const lastTwoEdits = edits.slice(-2) as [Edit, Edit]
            const reducedLastTwoEdits = [reduce(...lastTwoEdits)]
            const minWeightTail = listWithMinimumWeight(
                [lastTwoEdits, reducedLastTwoEdits],
                insertWeight, deleteWeight, replaceWeight
            )[0]
            if (minWeightTail === lastTwoEdits) return edits
            edits = [...edits.slice(0, -2), ...reducedLastTwoEdits]
        }
        return edits
    }

    const candidateEditLists: (readonly Edit[])[] = []

    const starting_string_less_one = startingString.slice(0, -1)
    const starting_string_last = startingString.slice(-1)
    const target_string_less_one = targetString.slice(0, -1)
    const target_string_last = targetString.slice(-1)

    if (target_string_last !== "") {
        candidateEditLists.push(
            recurse(startingString, target_string_less_one).concat({type: "insert", string: target_string_last})
        )
    }

    if (starting_string_last !== "") {
        candidateEditLists.push(
            recurse(starting_string_less_one, targetString).concat({type: "delete", string: starting_string_last})
        )
    }

    if (target_string_last !== "" && starting_string_last !== "") {
        candidateEditLists.push(
            recurse(starting_string_less_one, target_string_less_one).concat(
                starting_string_last === target_string_last
                    ? {type: "pass", string: starting_string_last}
                    : {type: "replace", string: target_string_last, original: starting_string_last}
            )
        )
    }

    if (candidateEditLists.length === 0) return []

    // Push the reduced variations of the candidate
    const result = listWithMinimumWeight(
        candidateEditLists.map(edits => reduceToMinimumWeight([...edits])),
        insertWeight, deleteWeight, replaceWeight
    )[0]

    memo.set(memoKey, result)

    return result
}

function listWithMinimumWeight(
    lists: readonly (readonly Edit[])[],
    insertWeight: ((string: string) => number) | number = string => string.length,
    deleteWeight: ((string: string) => number) | number = string => string.length,
    replaceWeight: ((original: string, string: string) => number) | number = (original, string) => Math.max(original.length, string.length)
): [readonly Edit[], number] {
    return lists.map(
        list => [
            list,
            minimumEditDistance(list, insertWeight, deleteWeight, replaceWeight)
        ] as [readonly Edit[], number]
    ).reduce(
        (min_list, next_list) => {
            if (next_list[1] < min_list[1]) return next_list
            if (next_list[1] === min_list[1] && next_list[0].length < min_list[0].length) return next_list
            return min_list
        }
    )
}

function minimumEditDistance(
    list: readonly Edit[],
    insertWeight: ((string: string) => number) | number = string => string.length,
    deleteWeight: ((string: string) => number) | number = string => string.length,
    replaceWeight: ((original: string, string: string) => number) | number = (original, string) => Math.max(original.length, string.length)
): number {
    let sum = 0
    for (const edit of list) {
        switch (edit.type) {
            case "insert":
                sum += typeof insertWeight === "number" ? insertWeight : insertWeight(edit.string)
                break
            case "delete":
                sum += typeof deleteWeight === "number" ? deleteWeight : deleteWeight(edit.string)
                break
            case "replace":
                sum += typeof replaceWeight === "number" ? replaceWeight : replaceWeight(edit.original, edit.string)
                break;
            case "pass":
                break
        }
    }
    return sum
}

const EDIT_REDUCTIONS = {
    "pass": {
        "pass": (last, next) => { return { type: "pass", string: last.string + next.string} },
        "insert": (last, next) => { return { type: "replace", string: last.string + next.string, original: last.string } },
        "delete": (last, next) => { return { type: "replace", string: last.string, original: last.string + next.string } },
        "replace": (last, next) => { return { type: "replace", string: last.string + next.string, original: last.string + next.original } }
    },
    "insert": {
        "pass": (last, next) => { return { type: "replace", string: last.string + next.string, original: next.string } },
        "insert": (last, next) => { return { type: "insert", string: last.string + next.string} },
        "delete": (last, next) => { return { type: "replace", string: last.string, original: next.string} },
        "replace": (last, next) => { return { type: "replace", string: last.string + next.string, original: next.original } }
    },
    "delete": {
        "pass": (last, next) => { return { type: "replace", string: next.string, original: last.string + next.string } },
        "insert": (last, next) => { return { type: "replace", string: next.string, original: last.string } },
        "delete": (last, next) => { return { type: "delete", string: last.string + next.string} },
        "replace": (last, next) => { return { type: "replace", string: last.string, original: last.string + next.original } }
    },
    "replace": {
        "pass": (last, next) => { return { type: "replace", string: last.string + next.string, original: last.original + next.string } },
        "insert": (last, next) => { return { type: "replace", string: last.string + next.string, original: last.original } },
        "delete": (last, next) => { return { type: "replace", string: last.string, original: last.original + next.string } },
        "replace": (last, next) => { return { type: "replace", string: last.string + next.string, original: last.original + next.original } }
    }
} as const satisfies {
    [LastType in Edit["type"]]: {
        [NextType in Edit["type"]]:
        ((last: Edit & { type: LastType }, next: Edit & { type: NextType }) => Edit)
    }
}

function reduce(last: Edit, next: Edit): Edit {
    return EDIT_REDUCTIONS[last.type][next.type](last as any, next as any)
}