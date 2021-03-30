import {BehaviorSubject} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {create_job} from "ufdl-ts-client/functional/core/jobs/job_template";
import {formatResponseError, handleErrorResponse} from "./util/responseError";
import observableWebSocket from "./util/observableWebSocket";
import {RawJSONObject} from "ufdl-ts-client/types";
import {immediateObservable} from "../util/rx/immediate";
import behaviourSubjectFromSubscribable from "../util/rx/behaviourSubjectFromSubscribable";

export default function createJob(
    context: UFDLServerContext,
    templatePK: number,
    createJobSpec: CreateJobSpec
): [Promise<number>, BehaviorSubject<RawJSONObject>] {
    const jobPK = handleErrorResponse(
        async () => {
            const job = await create_job(context, templatePK, createJobSpec);
            return job['pk'] as number;
        },
        async (response): Promise<never> => {
            throw new Error(await formatResponseError(response))
        }
    );

    return [
        jobPK,
        behaviourSubjectFromSubscribable(
            immediateObservable(
                jobPK.then((pk) => observableWebSocket(pk, true, true))
            ),
            {}
        )
    ];
}
