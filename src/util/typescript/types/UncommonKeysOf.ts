import {CommonKeysOf} from "./CommonKeysOf";

export type UncommonKeysOf<A extends {}, B extends {}> = Exclude<keyof A | keyof B, CommonKeysOf<A, B>>
