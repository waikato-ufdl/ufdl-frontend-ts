import {LoopStateAndData} from "./types";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {AnyPK, DatasetPK, fromJSON, ProjectPK, TeamPK} from "../../../../../server/pk";
import {LoopStates} from "./LoopStates";
import {DomainName, isDomainName} from "../../../../../server/domains";
import {monitorJob} from "../../../../../server/jobs/monitorJob";
import jobProgressSubject from "../../../../../server/jobs/jobProgressSubject";
import {isAllowedState, isAllowedStateAndData} from "../../../../../util/react/hooks/useStateMachine/isAllowedState";

export class DecodeError extends Error {
    constructor(
        value: string,
        expectedType: string
    ) {
        super(`Couldn't decode '${value}' as ${expectedType}`);
    }
}

const LOOP_STATE_KEY = "current-loop-state"
const LOOP_DATA_KEY = "current-loop-data"

export const SAVEABLE_LOOP_STATES = [
    "Selecting Primary Dataset",
    "Selecting Initial Images",
    "Selecting Prelabel Images",
    "Training",
    "Evaluating",
    "Checking",
    "Prelabel",
    "User Fixing Categories"
] as const

export type SaveableLoopStates = typeof SAVEABLE_LOOP_STATES[number]

export function isSaveableLoopState(
    state: keyof LoopStates
): state is SaveableLoopStates {
    return isAllowedState(state, ...SAVEABLE_LOOP_STATES)
}

export function isSaveableLoopStateAndData(
    stateAndData: LoopStateAndData
): stateAndData is LoopStateAndData<SaveableLoopStates> {
    return isAllowedStateAndData(stateAndData, ...SAVEABLE_LOOP_STATES)
}

export function trySaveLoopState(
    stateAndData: LoopStateAndData
) {
    if (isSaveableLoopStateAndData(stateAndData)) {
        saveLoopState(stateAndData)
    }
}

export function saveLoopState(
    state: LoopStateAndData<SaveableLoopStates>
) {
    const context = state.data.context
    context.store_item(LOOP_STATE_KEY, state.state, false)
    context.store_item(
        LOOP_DATA_KEY,
        JSON.stringify(
            {
                ...state.data,
                progress: undefined,
                context: undefined
            }
        ),
        false
    )
}

export function restoreLoopState(
    context: UFDLServerContext
): LoopStateAndData<SaveableLoopStates> | undefined {
    const state = context.get_item(LOOP_STATE_KEY, false)
    if (state === null) return undefined
    const data = context.get_item(LOOP_DATA_KEY, false)
    if (data === null) return undefined

    const deserialisedStateAndData = {
        state: state,
        data: JSON.parse(
            data,
            (_key, value) => {
                const result = typeof value === 'object' && 'type' in value?
                    fromJSON(value) ?? value
                    : value
                return result
            }
        )
    } as LoopStateAndData<SaveableLoopStates>

    if (isAllowedStateAndData(deserialisedStateAndData, "Prelabel", "Training", "Evaluating")) {
        deserialisedStateAndData.data.progress = jobProgressSubject(
            monitorJob(
                context,
                Promise.resolve(deserialisedStateAndData.data.jobPK)
            )
        )
    }

    deserialisedStateAndData.data.context = context

    return deserialisedStateAndData
}

function encodeAnyPK(
    data: AnyPK
): string {
    if (data === undefined)
        return ""
    else if (data instanceof TeamPK)
        return `${data.asNumber}`
    else if (data instanceof ProjectPK)
        return `${data.team.asNumber}>${data.asNumber}`
    else
        return `${data.team.asNumber}>${data.project.asNumber}>${data.asNumber}`
}

function decodeAnyPk(
    str: string
): AnyPK {
    if (str === "") return undefined

    const parts = str.split(">")

    let anyPK: AnyPK = new TeamPK(decodeNumber(parts[0]))
    if (parts.length > 1) {
        anyPK = anyPK.project(decodeNumber(parts[1]))
        if (parts.length > 2) anyPK = anyPK.dataset(decodeNumber(parts[2]))
    }
    return anyPK
}

function decodeDatasetPK(
    str: string
): DatasetPK {
    const anyPK = decodeAnyPk(str)
    if (!(anyPK instanceof DatasetPK)) throw new DecodeError(str, "DatasetPK")
    return anyPK
}

function decodeNonDatasetPK(
    str: string
): Exclude<AnyPK, DatasetPK> {
    const anyPK = decodeAnyPk(str)
    if (anyPK instanceof DatasetPK) throw new DecodeError(str, "Exclude<AnyPK, DatasetPK>")
    return anyPK
}

function encodeNumber(
    num: number
): string {
    return num.toString()
}

function decodeNumber(
    str: string
): number {
    const parsed = Number.parseInt(str)
    if (Object.is(parsed, NaN)) throw new DecodeError(str, "integer")
    return parsed
}

function decodeDomainName(
    str: string
): DomainName {
    if (!isDomainName(str))
        throw new DecodeError(str, "DomainName")

    return str
}

function encodeFramework(
    framework: [string, string]
): string {
    return `${framework[0]}|${framework[1]}`
}

function decodeFramework(
    str: string
): [string, string] {
    const parts = str.split("|")
    if (parts.length !== 2)
        throw new DecodeError(str, "framework")
    return [parts[0], parts[1]]
}