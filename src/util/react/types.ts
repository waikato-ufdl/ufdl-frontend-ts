import {JSXElementConstructor, ReactElement} from "react";

/**
 * The return-type of a function component.
 */
export type FunctionComponentReturnType<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>>
    = ReactElement<P, T> | null

/**
 * The type of a function component.
 */
export type FunctionComponent<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>>
    = (props: P) => FunctionComponentReturnType<P, T>

/**
 * Either a single T, or an array of T.
 */
export type OneOrMany<T> = T | T[]
