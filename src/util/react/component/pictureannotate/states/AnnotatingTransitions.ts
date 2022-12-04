import {AnnotatingStateAndData} from "./types";
import {createNewAnnotatingState} from "./createNewAnnotationState";
import {StateMachineTransitions} from "../../../hooks/useStateMachine/types/StateMachineTransitions";
import {AnnotatingStates} from "./AnnotatingStates";
import {FINISH_TRANSITION} from "./FINISH_TRANSITION";

export const ANNOTATING_TRANSITIONS = {
    "Idle": {
        refresh(
            this: AnnotatingStateAndData<"Idle">
        ) {
            return createNewAnnotatingState("Idle")()
        },
        addBox(
            this: AnnotatingStateAndData<"Idle">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Adding Box")(
                {
                    x,
                    y,
                    width: 0,
                    height: 0
                }
            )
        },
        addPolygon(
            this: AnnotatingStateAndData<"Idle">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Adding Polygon")(
                {
                    x,
                    y,
                    points: [{x, y}]
                }
            )
        },
        moveShape(
            this: AnnotatingStateAndData<"Idle">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Moving Shape")(
                {
                    x,
                    y
                }
            )
        },
        moveHandle(
            this: AnnotatingStateAndData<"Idle">,
            handleIndex: number,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Moving Handle")(
                {
                    handleIndex,
                    x,
                    y
                }
            )
        }
    },
    "Adding Box": {
        update(
            this: AnnotatingStateAndData<"Adding Box">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Adding Box")(
                {
                    ...this.data,
                    width: x - this.data.x + 1,
                    height: y - this.data.y + 1
                }
            )
        },
        finish: FINISH_TRANSITION
    },
    "Adding Polygon": {
        update(
            this: AnnotatingStateAndData<"Adding Polygon">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Adding Polygon")(
                {
                    ...this.data,
                    x,
                    y
                }
            )
        },
        newPoint(
            this: AnnotatingStateAndData<"Adding Polygon">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Adding Polygon")(
                {
                    points: [...this.data.points, { x, y }],
                    x,
                    y
                }
            )
        },
        finish: FINISH_TRANSITION
    },
    "Moving Shape": {
        update(
            this: AnnotatingStateAndData<"Moving Shape">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Moving Shape")(
                {
                    ...this.data,
                    x,
                    y
                }
            )
        },
        finish: FINISH_TRANSITION
    },
    "Moving Handle": {
        update(
            this: AnnotatingStateAndData<"Moving Handle">,
            x: number,
            y: number
        ) {
            return createNewAnnotatingState("Moving Handle")(
                {
                    ...this.data,
                    x,
                    y
                }
            )
        },
        finish: FINISH_TRANSITION
    }
} as const satisfies StateMachineTransitions<AnnotatingStates>

export type AnnotatingTransitions = typeof ANNOTATING_TRANSITIONS
