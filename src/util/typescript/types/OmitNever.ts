import {NeverKeys} from "./NeverKeys";

export type OmitNever<T> = Omit<T, NeverKeys<T>>
