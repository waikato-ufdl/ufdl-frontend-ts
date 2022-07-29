import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {get_output_info} from "ufdl-ts-client/functional/core/jobs/job";
import {DomainName} from "../../../../server/domains";

export default async function getModelOutputPK(
    context: UFDLServerContext,
    jobPK: number,
    domain: DomainName,
    framework: [string, string]
): Promise<number> {
    const output = await get_output_info(
        context,
        jobPK,
        "model",
        `Model<Domain<'${domain}'>, Framework<'${framework[0]}', '${framework[1]}'>>`
    );

    return output['pk'] as number;
}