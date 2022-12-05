import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec, ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {BehaviorSubject} from "rxjs";
import {DatasetPK} from "../../../../server/pk";
import webSocketNotificationOverride from "../webSocketNotificationOverride";
import createJob from "../../../../server/jobs/createJob";
import jobProgressSubject from "../../../../server/jobs/jobProgressSubject";
import {DomainName} from "../../../../server/domains";

export default function evaluate(
    context: UFDLServerContext,
    templatePK: number,
    datasetPK: DatasetPK,
    modelOutputPK: number,
    parameter_values: { [name: string]: ParameterValue },
    domain: DomainName,
    framework: [string, string]
): [Promise<number>, BehaviorSubject<[number, string | undefined]>] {
    const createJobSpec: CreateJobSpec = {
        description: `Evaluate-job created for ${domain} dataset ${datasetPK.asNumber}`,
        input_values: {
            model: {
                value: modelOutputPK,
                type: `JobOutput<Model<Domain<'${domain}'>, Framework<'${framework[0]}', '${framework[1]}'>>>`
            },
            dataset: {
                value: datasetPK.asNumber,
                type: `PK<Dataset<Domain<'${domain}'>>>`
            }
        },
        parameter_values: parameter_values,
        notification_override: webSocketNotificationOverride()
    };

    const [pk, subject] = createJob(context, templatePK, createJobSpec);

    return [pk, jobProgressSubject(subject)];
}