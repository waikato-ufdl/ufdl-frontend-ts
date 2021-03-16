import {Reducer} from "react";
import useDerivedState from "./useDerivedState";
import {useNonUpdatingReducer} from "./useNonUpdatingReducer";
import useUpdateTrigger from "./useUpdateTrigger";

export type UpdateControlledDispatch<A> = (action: A, update: boolean) => void

export default function useControlledUpdateReducer<S, A>(
    reducer: Reducer<S, A>,
    initialiser: () => S
): [S, UpdateControlledDispatch<A>] {

    const [state, dispatch] = useNonUpdatingReducer(
        reducer,
        initialiser
    );

    const updateTrigger = useUpdateTrigger();

    const updateControlledDispatch = useDerivedState(
        ([dispatch, updateTrigger]) => (action: A, update: boolean) => {
            dispatch(action);
            if (update) updateTrigger();
        },
        [dispatch, updateTrigger] as const
    );

    return [state, updateControlledDispatch];
}