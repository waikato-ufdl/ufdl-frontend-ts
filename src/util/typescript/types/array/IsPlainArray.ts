import {And} from "../conditional/And";
import {IsArray} from "./IsArray";
import {Not} from "../conditional/Not";
import {Or} from "../conditional/Or";
import {IsTuple} from "./IsTuple";
import {IsHybridArray} from "./IsHybridArray";

/**
 * Whether the type T is a plain array (all elements have the
 * same type).
 */
export type IsPlainArray<T>
    = And<IsArray<T>, Not<Or<IsTuple<T>, IsHybridArray<T>>>>
