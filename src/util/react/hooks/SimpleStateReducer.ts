import {Reducer} from "react";

export type SimpleStateReducer<S> = Reducer<S, S>;

function simpleStateReducer(_: any, newValue: any): any {
    return newValue;
}

export function createSimpleStateReducer<S>(): SimpleStateReducer<S> {
    return simpleStateReducer;
}
