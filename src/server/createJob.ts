import {BehaviorSubject} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {create_job} from "ufdl-ts-client/functional/core/jobs/job_template";
import {handleErrorResponse} from "./error/handleErrorResponse";
import {ERROR_RESPONSE_HANDLERS} from "./error/ERROR_RESPONSE_HANDLERS";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "./error/DEFAULT_HANDLED_ERROR_RESPONSE";
import observeJobTransitionsViaWebSocket from "./websocket/observeJobTransitionsViaWebSocket";
import {immediateObservable} from "../util/rx/immediate";
import behaviourSubjectFromSubscribable from "../util/rx/behaviourSubjectFromSubscribable";
import behaviourSubjectCompletionPromise from "../util/rx/behaviourSubjectCompletionPromise";
import {getJobLog} from "./util/getJobLog";
import {JobTransitionMessage} from "ufdl-ts-client/types/core/jobs/job";
import {EMPTY, Empty} from "../util/typescript/types/Empty";
import onPromiseCompletion from "../util/typescript/async/onPromiseCompletion";
import {forEachOwnProperty} from "../util/typescript/object";
import {JobLog} from "./types/JobLog";

/**
 * Creates a new job on the server and automatically begins monitoring its progress
 * via web-socket.
 *
 * @param context
 *          The context of the server on which to start the job.
 * @param templatePK
 *          The primary key of the job-template to create the job against.
 * @param createJobSpec
 *          The specification of how to create the job.
 * @return
 *          A promise of the created job's primary key, and a behaviour subject
 *          for observing the job's state-transitions via web-socket.
 */
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
        ERROR_RESPONSE_HANDLERS.THROW
    );

    // Start monitoring the job
    const monitor = monitorJob(context, jobPK, createJobSpec.description)

    return [jobPK, monitor];
}

/**
 * Attaches to a job on the server to receive state-transitions via web-socket.
 *
 * @param context
 *          The context of the server on which the job resides.
 * @param jobPK
 *          The primary key of the job to monitor.
 * @param description
 *          Optional description of the job to include with console log messages.
 */
export function monitorJob(
    context: UFDLServerContext,
    jobPK: Promise<number>,
    description?: string,
): BehaviorSubject<JobTransitionMessage | Empty> {
    // Create a behaviour subject to monitor the job's progress
    const jobMonitor = behaviourSubjectFromSubscribable<JobTransitionMessage | Empty>(
        immediateObservable(
            jobPK.then(
                pk => observeJobTransitionsViaWebSocket(context, pk, true, true)
            )
        ),
        EMPTY
    );

    // Always print the log on job completion
    onPromiseCompletion(
        behaviourSubjectCompletionPromise(jobMonitor),
        async result => {
            // Check whether job-creation failed
            let pk: number
            try {
                pk = await jobPK;
            } catch (e) {
                console.error(`Error creating job '${description}'`, e)
                return
            }

            if (!result.success) {
                console.error(`Error monitoring job #${pk} (${description})`, result)
            }

            console.group(`Job log for job #${pk} (${description})`)

            let log: JobLog | typeof DEFAULT_HANDLED_ERROR_RESPONSE = DEFAULT_HANDLED_ERROR_RESPONSE
            try {
                log = await handleErrorResponse(
                    () => getJobLog(context, pk),
                    ERROR_RESPONSE_HANDLERS.CONSOLE_ERROR
                )
            } catch (e) {
                console.error(`Failed to get job log for job #${pk} (${description})`, e);
            }

            if (log !== DEFAULT_HANDLED_ERROR_RESPONSE) {
                forEachOwnProperty(
                    log,
                    (timestamp, obj) => {
                        console.log(timestamp, obj)
                    }
                )
            }

            console.groupEnd()
        }
    );

    return jobMonitor
}
