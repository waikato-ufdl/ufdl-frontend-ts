import {CommonKeysOf} from "./CommonKeysOf";
import {OmitNever} from "./OmitNever";

export type CommonPropertiesOf<A extends {}, B extends {}> = OmitNever<{
    [K in CommonKeysOf<A, B>]: A[K] & B[K]
}>
