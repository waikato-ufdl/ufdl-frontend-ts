import {BehaviorSubject} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {create_job} from "ufdl-ts-client/functional/core/jobs/job_template";
import {handleErrorResponse, throwOnError} from "./util/responseError";
import observableWebSocket from "./websocket/observableWebSocket";
import {RawJSONObject} from "ufdl-ts-client/types/raw";
import {immediateObservable} from "../util/rx/immediate";
import behaviourSubjectFromSubscribable from "../util/rx/behaviourSubjectFromSubscribable";
import completionPromise from "../util/rx/completionPromise";
import {getJobLog} from "./util/getJobLog";

export default function createJob(
    context: UFDLServerContext,
    templatePK: number,
    createJobSpec: CreateJobSpec
): [Promise<number>, BehaviorSubject<RawJSONObject>] {
    // Create the job and extract its PK from the response
    const jobPK = handleErrorResponse(
        async () => {
            const job = await create_job(context, templatePK, createJobSpec);
            return job.pk;
        },
        throwOnError
    );

    // Create a behaviour subject to monitor the job's progress
    const jobMonitor = behaviourSubjectFromSubscribable(
        immediateObservable(
            jobPK.then((pk) => observableWebSocket(context, pk, true, true))
        ),
        {}
    );

    // Always print the log on job completion
    completionPromise(jobMonitor).finally(
        async () => {
            const pk = await jobPK;
            console.log(
                `Job log for job #${pk}`,
                await getJobLog(context, pk)
            );
        }
    );

    return [jobPK, jobMonitor];
}
