import {AnnotatingStateAndData} from "./types";
import {createNewAnnotatingState} from "./createNewAnnotationState";

export const ANNOTATING_TRANSITIONS = {
    "Idle": {
        refresh() {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Idle") return

                return createNewAnnotatingState("Idle")(
                    {
                        ...current.data
                    }
                )
            }
        },
        addBox(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Idle") return

                return createNewAnnotatingState("Adding Box")(
                    {
                        x,
                        y,
                        width: 0,
                        height: 0
                    }
                )
            }
        },
        addPolygon(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Idle") return

                return createNewAnnotatingState("Adding Polygon")(
                    {
                        x,
                        y,
                        points: [{x, y}]
                    }
                )
            }
        },
        moveShape(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Idle") return

                return createNewAnnotatingState("Moving Shape")(
                    {
                        x,
                        y
                    }
                )
            }
        },
        moveHandle(handleIndex: number, x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Idle") return

                return createNewAnnotatingState("Moving Handle")(
                    {
                        handleIndex,
                        x,
                        y
                    }
                )
            }
        }
    },
    "Adding Box": {
        update(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Adding Box") return

                return createNewAnnotatingState("Adding Box")(
                    {
                        ...current.data,
                        width: x - current.data.x + 1,
                        height: y - current.data.y + 1
                    }
                )
            }
        },
        finish() {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Adding Box") return

                return createNewAnnotatingState("Idle")({})
            }
        }
    },
    "Adding Polygon": {
        update(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Adding Polygon") return

                return createNewAnnotatingState("Adding Polygon")(
                    {
                        ...current.data,
                        x,
                        y
                    }
                )
            }
        },
        newPoint(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Adding Polygon") return

                return createNewAnnotatingState("Adding Polygon")(
                    {
                        points: [...current.data.points, { x, y }],
                        x,
                        y
                    }
                )
            }
        },
        finish() {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Adding Polygon") return

                return createNewAnnotatingState("Idle")({})
            }
        }
    },
    "Moving Shape": {
        update(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Moving Shape") return

                return createNewAnnotatingState("Moving Shape")(
                    {
                        ...current.data,
                        x,
                        y
                    }
                )
            }
        },
        finish() {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Moving Shape") return

                return createNewAnnotatingState("Idle")({})
            }
        }
    },
    "Moving Handle": {
        update(x: number, y: number) {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Moving Handle") return

                return createNewAnnotatingState("Moving Handle")(
                    {
                        ...current.data,
                        x,
                        y
                    }
                )
            }
        },
        finish() {
            return (current: AnnotatingStateAndData) => {
                if (current.state !== "Moving Handle") return

                return createNewAnnotatingState("Idle")({})
            }
        }
    }
}

export type AnnotatingTransitions = typeof ANNOTATING_TRANSITIONS
