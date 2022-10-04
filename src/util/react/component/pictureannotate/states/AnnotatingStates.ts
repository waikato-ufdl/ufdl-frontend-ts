import {ValidStates} from "../../../hooks/useStateMachine/types";
import {Point} from "../util/Point";

export type AnnotatingStates = ValidStates<{
    "Idle": {
    },
    "Adding Box": {
        x: number
        y: number
        width: number
        height: number
    },
    "Adding Polygon": {
        points: readonly [Point, ...Point[]]
        x: number
        y: number
    },
    "Moving Shape": {
        x: number
        y: number
    },
    "Moving Handle": {
        handleIndex: number
        x: number
        y: number
    }
}>
