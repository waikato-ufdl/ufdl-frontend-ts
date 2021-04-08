import useControlledUpdateReducer, {UpdateControlledDispatch} from "./useControlledUpdateReducer";
import {createSimpleStateReducer} from "./SimpleStateReducer";

export function useControlledUpdateState<S>(
    init: () => S
): [S, UpdateControlledDispatch<S>] {
    return useControlledUpdateReducer(
        createSimpleStateReducer<S>(),
        init
    );
}
