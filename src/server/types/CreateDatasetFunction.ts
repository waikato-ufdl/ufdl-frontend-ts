import UFDLServerContext from "../../../../ufdl-ts-client/dist/UFDLServerContext";
import {DatasetInstance} from "../../../../ufdl-ts-client/dist/types/core/dataset";

export type CreateDatasetFunction = (
    context: UFDLServerContext,
    name: string,
    project: number,
    licence: number,
    description?: string,
    is_public?: boolean,
    tags?: string
) => Promise<DatasetInstance>