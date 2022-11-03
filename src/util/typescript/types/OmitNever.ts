import {NeverKeys} from "./NeverKeys";

export type OmitNever<T extends {}> = Omit<T, NeverKeys<T>>
