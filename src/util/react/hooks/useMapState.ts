import {Dispatch, Reducer, useReducer} from "react";
import {copyMap} from "../../map";
import useDerivedState from "./useDerivedState";
import useStaticStateAccessor, {StateAccessor} from "./useStaticStateAccessor";

export const CLEAR = Symbol("clear");

export type MapStateReducerClearAction = {
    action: typeof CLEAR
}

export const DELETE = Symbol("delete");

export type MapStateReducerDeleteAction<K> = {
    action: typeof DELETE
    key: K
}

export const SET = Symbol("set");

export type MapStateReducerSetAction<K, V> = {
    action: typeof SET
    key: K
    value: V
}

export type MapStateReducerAction<K, V> =
    | MapStateReducerClearAction
    | MapStateReducerDeleteAction<K>
    | MapStateReducerSetAction<K, V>

export type MapStateReducer<K, V> = Reducer<ReadonlyMap<K, V>, MapStateReducerAction<K, V>>

function mapStateReducer(
    currentState: ReadonlyMap<any, any>,
    action: MapStateReducerAction<any, any>
) {
    switch (action.action) {
        case CLEAR: {
            return new Map();
        }
        case DELETE: {
            const result = copyMap(currentState);
            result.delete(action.key);
            return result;
        }
        case SET: {
            const result = copyMap(currentState);
            result.set(action.key, action.value);
            return result;
        }
    }
}

export function createMapStateReducer<K, V>(): MapStateReducer<K, V> {
    return mapStateReducer;
}

export class MapStateDispatch<K, V> {
    constructor(
        private readonly _state: StateAccessor<ReadonlyMap<K, V>>,
        private dispatch: Dispatch<MapStateReducerAction<K, V>>
    ) {}
    get state() {return this._state()}
    clear(): void {this.dispatch({action: CLEAR})}
    delete(key: K): void {this.dispatch({action: DELETE, key: key});}
    set(key: K, value: V): void {this.dispatch({action: SET, key: key, value: value});}
}

export default function useMapState<K, V>(
    // No parameters
): MapStateDispatch<K, V> {

    const [reducerState, dispatch] = useReducer(
        mapStateReducer as MapStateReducer<K, V>,
        null,
        () => new Map()
    );

    const reducerStateAccessor = useStaticStateAccessor(reducerState);

    return useDerivedState(
        () => new MapStateDispatch<K, V>(reducerStateAccessor, dispatch),
        [reducerStateAccessor, dispatch]
    );
}
