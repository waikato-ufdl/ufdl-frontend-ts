import {ReactElement} from "react";

/**
 * The return-type of a function component.
 */
export type FunctionComponentReturnType = ReactElement<any, any> | null

/**
 * Either a single T, or an array of T.
 */
export type OneOrMany<T> = T | T[]
