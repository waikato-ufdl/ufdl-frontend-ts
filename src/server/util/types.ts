import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {FilterSpec} from "ufdl-ts-client/json/generated/FilterSpec";
import {RawJSONObject} from "ufdl-ts-client/types";

export type ListFunction = (context: UFDLServerContext, filterSpec?: FilterSpec) => Promise<RawJSONObject[]>

export type CreateFunction = (
    context: UFDLServerContext,
    name: string,
    project: number,
    licence: number,
    description?: string,
    is_public?: boolean,
    tags?: string
) => Promise<RawJSONObject>
