import {PossiblePromise} from "../../typescript/types/promise";
import useDerivedReducer from "./useDerivedReducer";
import {createSimpleStateReducer} from "./SimpleStateReducer";
import isPromise from "../../typescript/async/isPromise";
import {useEffect} from "react";
import pass from "../../typescript/functions/pass";

export type Resolved<T> = {
    status: "resolved"
    value: T
}

export type Rejected ={
    status: "rejected"
    reason: any
}

export type Pending = {
    status: "pending"
}

export type Resolution<T> = Resolved<T> | Rejected | Pending

const USE_PROMISE_REDUCER = createSimpleStateReducer<Resolution<any>>()

function usePromiseInitialiser<T>(
    [args]: readonly [PossiblePromise<T>]
): Resolution<T> {
    if (!isPromise(args)) return {
        status: "resolved",
        value: args
    }

    return {
        status: "pending"
    }
}

export default function usePromise<T>(
    promise: PossiblePromise<T>
): Resolution<T> {

    const [resolution, setResolution] = useDerivedReducer<Resolution<T>, Resolution<T>, readonly [PossiblePromise<T>]>(
        USE_PROMISE_REDUCER,
        usePromiseInitialiser,
        [promise] as const
    )

    useEffect(
        () => {
            if (!isPromise(promise)) return

            let setResolutionSingle = setResolution

            promise.then(
                value => {
                    setResolutionSingle({ status: "resolved", value})
                    setResolutionSingle = pass
                }
            ).catch(
                reason => {
                    setResolutionSingle({ status: "rejected", reason})
                    setResolutionSingle = pass
                }
            )

            return () => { setResolutionSingle = pass }
        },
        [promise, setResolution]
    )

    return resolution
}