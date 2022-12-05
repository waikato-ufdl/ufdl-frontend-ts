import {RawModelInstance} from "ufdl-ts-client/types/base";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {FilterSpec} from "ufdl-ts-client/json/generated/FilterSpec";

export type ListFunction<M extends RawModelInstance> = (
    context: UFDLServerContext,
    filterSpec?: FilterSpec
) => Promise<M[]>