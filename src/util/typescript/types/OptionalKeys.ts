import {UndefinableKeys} from "./UndefinableKeys";

/**
 * Gets the optional keys of T.
 */
export type OptionalKeys<T> = Exclude<UndefinableKeys<T>, UndefinableKeys<Required<T>>>
