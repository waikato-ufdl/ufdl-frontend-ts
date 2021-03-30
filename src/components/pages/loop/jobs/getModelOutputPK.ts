import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {get_output_info} from "ufdl-ts-client/functional/core/jobs/job";

export default async function getModelOutputPK(
    context: UFDLServerContext,
    jobPK: number
): Promise<number> {
    const output = await get_output_info(context, jobPK, "model", "tficmodel");

    return output['pk'] as number;
}