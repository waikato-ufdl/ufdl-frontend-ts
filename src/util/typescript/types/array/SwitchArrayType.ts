import {If} from "../conditional/If";
import {IsTuple} from "./IsTuple";
import {IsHybridArray} from "./IsHybridArray";

/** Returns one of the three types based on what type of array is passed. */
export type SwitchArrayType<
    T extends readonly unknown[],
    Plain,
    Hybrid,
    Tuple
> = If<
        IsTuple<T>,
        Tuple,
        If<
            IsHybridArray<T>,
            Hybrid,
            Plain
        >
    >
