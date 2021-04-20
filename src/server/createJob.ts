import {BehaviorSubject} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {create_job} from "ufdl-ts-client/functional/core/jobs/job_template";
import {handleErrorResponse, throwOnError} from "./util/responseError";
import observableWebSocket from "./websocket/observableWebSocket";
import {immediateObservable} from "../util/rx/immediate";
import behaviourSubjectFromSubscribable from "../util/rx/behaviourSubjectFromSubscribable";
import completionPromise from "../util/rx/completionPromise";
import {getJobLog} from "./util/getJobLog";
import {JobTransitionMessage} from "ufdl-ts-client/types/core/jobs/job";
import {EMPTY, Empty} from "../util/typescript/types/Empty";
import onCompletion from "../util/typescript/async/onCompletion";

export default function createJob(
    context: UFDLServerContext,
    templatePK: number,
    createJobSpec: CreateJobSpec
): [Promise<number>, BehaviorSubject<JobTransitionMessage | Empty>] {
    // Create the job and extract its PK from the response
    const jobPK = handleErrorResponse(
        async () => {
            const job = await create_job(context, templatePK, createJobSpec);
            return job.pk;
        },
        throwOnError
    );

    // Create a behaviour subject to monitor the job's progress
    const jobMonitor = behaviourSubjectFromSubscribable<JobTransitionMessage | Empty>(
        immediateObservable(
            jobPK.then((pk) => observableWebSocket(context, pk, true, true))
        ),
        EMPTY
    );

    // Always print the log on job completion
    onCompletion(
        completionPromise(jobMonitor),
        async () => {
            const pk = await jobPK;

            try {
                console.log(`Job log for job #${pk}`, await getJobLog(context, pk));
            } catch (e) {
                console.log(`Failed to get job log for job #${pk}`, e);
            }
        }
    );

    return [jobPK, jobMonitor];
}
