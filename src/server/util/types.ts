import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {FilterSpec} from "ufdl-ts-client/json/generated/FilterSpec";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {RawModelInstance} from "ufdl-ts-client/types/base";

export type ListFunction<M extends RawModelInstance> = (
    context: UFDLServerContext,
    filterSpec?: FilterSpec
) => Promise<M[]>

export type CreateDatasetFunction = (
    context: UFDLServerContext,
    name: string,
    project: number,
    licence: number,
    description?: string,
    is_public?: boolean,
    tags?: string
) => Promise<DatasetInstance>
