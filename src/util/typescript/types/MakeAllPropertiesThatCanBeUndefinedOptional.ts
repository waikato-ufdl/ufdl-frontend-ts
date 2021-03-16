import {SemiPartial} from "./SemiPartial";
import {UndefinableKeys} from "./UndefinableKeys";

/**
 * Ensures that any properties of type T that can be assigned the
 * value undefined are also optional.
 */
export type MakeAllPropertiesThatCanBeUndefinedOptional<T> = SemiPartial<T, UndefinableKeys<T>>
