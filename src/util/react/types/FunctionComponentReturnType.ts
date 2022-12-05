import {JSXElementConstructor, ReactElement} from "react";

/**
 * The return-type of a function component.
 */
export type FunctionComponentReturnType<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>>
    = ReactElement<P, T> | null
