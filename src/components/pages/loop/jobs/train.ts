import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-js-client/json/generated/CreateJobSpec";
import {BehaviorSubject} from "rxjs";
import {DatasetPK} from "../../../../server/pk";
import webSocketNotificationOverride from "../webSocketNotificationOverride";
import createJob from "../../../../server/createJob";
import jobProgressSubject from "../../../../server/util/jobProgressSubject";

export default function train(
    context: UFDLServerContext,
    pk: DatasetPK
): [
    Promise<number>,
    BehaviorSubject<number>
] {
    const createJobSpec: CreateJobSpec = {
        description: `Train-job created for dataset ${pk.asNumber}`,
        input_values: {
            data: {
                value: pk.asNumber.toString(),
                type: "dataset"
            }
        },
        parameter_values: {
            docker_image: "2",
            steps: "50"
        },
        notification_override: webSocketNotificationOverride()
    };

    const [jobPK, jobSubject] = createJob(context, 1, createJobSpec);

    return [
        jobPK,
        jobProgressSubject(jobSubject)
    ];
}
