import useDerivedState from "../../hooks/useDerivedState";
import useDerivedReducer, {UNINITIALISED} from "../../hooks/useDerivedReducer";
import {Dispatch} from "react";

export type ScaleAction = {
    type: "scale"
    factor: number
    offsetX: number
    offsetY: number
}

export type TranslateAction = {
    type: "translate"
    x: number
    y: number
}

export type ResetAction = {
    type: "reset"
    scale: boolean
    translation: boolean
}

export type SetAction = Transform & {
    type: "set"
}

export type LinearTransformAction = ScaleAction | TranslateAction | ResetAction | SetAction

export type Transform = {
    scale: number
    translateX: number
    translateY: number
}

const INITIAL_TRANSFORM: Transform = {
    scale: 1.0,
    translateX: 0.0,
    translateY: 0.0
}

function linearTransformReducer(
    [state, scaleSpeed]: [Transform, number],
    action: LinearTransformAction
): [Transform, number] {
    switch (action.type) {
        case "scale":
            const preScale = state.scale
            let newScale = state.scale + action.factor * scaleSpeed
            if (newScale > 10) newScale = 10
            if (newScale < 0.1) newScale = 0.1

            const { translateX, translateY } = state;
            const { offsetX, offsetY } = action;

            return [
                {
                    scale: newScale,
                    translateX: offsetX - ((offsetX - translateX) / preScale) * newScale,
                    translateY: offsetY - ((offsetY - translateY) / preScale) * newScale
                },
                scaleSpeed
            ]
        case "translate":
            return [
                {
                    scale: state.scale,
                    translateX: state.translateX + state.scale * action.x,
                    translateY: state.translateY + state.scale * action.y,
                },
                scaleSpeed
            ]
        case "reset":
            return [
                {
                    scale: action.scale ? INITIAL_TRANSFORM.scale : state.scale,
                    translateX: action.translation ? INITIAL_TRANSFORM.translateX : state.translateX,
                    translateY: action.translation ? INITIAL_TRANSFORM.translateY : state.translateY
                },
                scaleSpeed
            ]
        case "set":
            return [
                {
                    scale: action.scale,
                    translateX: action.translateX,
                    translateY: action.translateY
                },
                scaleSpeed
            ]
    }
}

function linearTransformInitialiser(
    [newScaleSpeed]: readonly [number],
    state: [Transform, number] | typeof UNINITIALISED
): [Transform, number] {
    const previousState = state === UNINITIALISED ? INITIAL_TRANSFORM : state[0]
    return [previousState, newScaleSpeed]
}

export type Application = (x: number, y: number) => { x: number, y: number }

export type LinearTransformDispatch = Transform & {
    update: Dispatch<LinearTransformAction>
    transformPoint: Application
    transformVector: Application
    inverseTransformPoint: Application
    inverseTransformVector: Application
}

export default function useLinearTransform(
    scaleSpeed: number
): LinearTransformDispatch {

    const [[transform], updateTransform] = useDerivedReducer(
        linearTransformReducer,
        linearTransformInitialiser,
        [scaleSpeed] as const
    )

    const applications = useDerivedState(
        ([transform]) => {
            return {
                transformPoint(x: number, y: number) {
                    return {
                        x: x * transform.scale + transform.translateX,
                        y: y * transform.scale + transform.translateY
                    }
                },
                transformVector(x: number, y: number) {
                    return {
                        x: x * transform.scale,
                        y: y * transform.scale
                    }
                },
                inverseTransformPoint(x: number, y: number) {
                    return {
                        x: (x - transform.translateX) / transform.scale,
                        y: (y - transform.translateY) / transform.scale
                    }

                },
                inverseTransformVector(x: number, y: number) {
                    return {
                        x: x / transform.scale,
                        y: y / transform.scale
                    }
                }
            }
        },
        [transform] as const
    )

    return {
        ...transform,
        update: updateTransform,
        ...applications
    }

}