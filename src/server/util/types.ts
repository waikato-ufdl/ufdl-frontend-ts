import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {FilterSpec} from "ufdl-js-client/json/generated/FilterSpec";
import {RawJSONObject} from "ufdl-js-client/types";

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
