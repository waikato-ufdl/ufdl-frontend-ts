import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";

export default async function getPredictTemplatesMatchingTrainTemplate(
    ufdlServerContext: UFDLServerContext,
    trainTemplatePK: number
): Promise<[JobTemplateInstance[], string]> {
    const trainTemplateOutputs = await job_template.get_outputs(ufdlServerContext, trainTemplatePK)

    const modelOutputType = trainTemplateOutputs["model"];

    const matchingPredictTemplates = await job_template.get_all_matching_templates(
        ufdlServerContext,
        "Predict",
        {model: `JobOutput<${modelOutputType}>`}
    )

    return [matchingPredictTemplates, modelOutputType]
}
