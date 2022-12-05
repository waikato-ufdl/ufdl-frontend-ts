import {JSXElementConstructor} from "react";
import {FunctionComponentReturnType} from "./FunctionComponentReturnType";

/**
 * The type of a function component.
 */
export type FunctionComponent<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>>
    = (props: P) => FunctionComponentReturnType<P, T>
