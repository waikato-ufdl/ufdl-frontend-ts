import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {BehaviorSubject} from "rxjs";
import {DatasetPK} from "../../../../server/pk";
import webSocketNotificationOverride from "../webSocketNotificationOverride";
import createJob from "../../../../server/createJob";
import jobProgressSubject from "../../../../server/util/jobProgressSubject";

export default function evaluate(
    context: UFDLServerContext,
    datasetPK: DatasetPK,
    modelOutputPK: number
): [Promise<number>, BehaviorSubject<number>] {
    const createJobSpec: CreateJobSpec = {
        description: `Evaluate-job created for dataset ${datasetPK.asNumber}`,
        input_values: {
            model: {
                value: modelOutputPK.toString(),
                type: "job_output<tficmodeltflite>"
            },
            data: {
                value: datasetPK.asNumber.toString(),
                type: "dataset"
            }
        },
        parameter_values: {
            docker_image: "2",
            "clear-dataset": "true",
            "store-predictions": "true",
            "confidence-scores": "ufdl.joblauncher.classify.confidence.TopScore"
        },
        notification_override: webSocketNotificationOverride()
    };

    const [pk, subject] = createJob(context, 2, createJobSpec);

    return [pk, jobProgressSubject(subject)];
}