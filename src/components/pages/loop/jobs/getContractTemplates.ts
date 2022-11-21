import * as job_template from "../../../../../../ufdl-ts-client/dist/functional/core/jobs/job_template";
import {DomainName} from "../../../../server/domains";
import UFDLServerContext from "../../../../../../ufdl-ts-client/dist/UFDLServerContext";
import {JobTemplateInstance} from "../../../../../../ufdl-ts-client/dist/types/core/jobs/job_template";

export default async function getContractTemplates(
    ufdlServerContext: UFDLServerContext,
    domain: DomainName,
    contract: "Train" | "Predict",
    modelType?: string
): Promise<JobTemplateInstance[]> {
    // Format the expected type of the input dataset
    const inputTypes: {[input: string]: string} = {dataset: `PK<Dataset<Domain<'${domain}'>>>`}

    if (modelType !== undefined) {
        inputTypes['model'] = `JobOutput<${modelType}>`
    }

    return job_template.get_all_matching_templates(
        ufdlServerContext,
        contract,
        inputTypes
    )
}