import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec, ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {BehaviorSubject} from "rxjs";
import {DatasetPK} from "../../../../server/pk";
import webSocketNotificationOverride from "../webSocketNotificationOverride";
import createJob from "../../../../server/createJob";
import jobProgressSubject from "../../../../server/util/jobProgressSubject";
import {DomainName} from "../../../../server/domains";

export default function train(
    context: UFDLServerContext,
    pk: DatasetPK,
    template_pk: number,
    parameter_values: { [name: string]: ParameterValue },
    domain: DomainName
): [
    Promise<number>,
    BehaviorSubject<number>
] {
    const createJobSpec: CreateJobSpec = {
        description: `Train-job created for ${domain} dataset ${pk.asNumber}`,
        input_values: {
            dataset: {
                value: pk.asNumber,
                type: `PK<Dataset<Domain<'${domain}'>>>`
            }
        },
        parameter_values: parameter_values,
        notification_override: webSocketNotificationOverride()
    };

    const [jobPK, jobSubject] = createJob(context, template_pk, createJobSpec);

    return [
        jobPK,
        jobProgressSubject(jobSubject)
    ];
}
