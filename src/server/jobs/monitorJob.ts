import {BehaviorSubject} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {handleErrorResponse} from "../error/handleErrorResponse";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "../error/DEFAULT_HANDLED_ERROR_RESPONSE";
import observeJobTransitionsViaWebSocket from "./observeJobTransitionsViaWebSocket";
import {immediateObservable} from "../../util/rx/immediate";
import behaviourSubjectFromSubscribable from "../../util/rx/behaviourSubjectFromSubscribable";
import behaviourSubjectCompletionPromise from "../../util/rx/behaviourSubjectCompletionPromise";
import {getJobLog} from "./getJobLog";
import {JobTransitionMessage} from "ufdl-ts-client/types/core/jobs/job";
import {EMPTY, Empty} from "../../util/typescript/types/Empty";
import onPromiseCompletion from "../../util/typescript/async/onPromiseCompletion";
import {ERROR_RESPONSE_HANDLERS} from "../error/ERROR_RESPONSE_HANDLERS";
import {forEachOwnProperty} from "../../util/typescript/object";
import {JobLog} from "../types/JobLog";
import tryExpression from "../../util/typescript/error/tryExpression";

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
        async () => {
            // Check whether job-creation failed
            const pk: number | undefined = await tryExpression(
                () => jobPK,
                () => undefined
            )
            if (pk === undefined) return

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
                console.group(`Job log for job #${pk} (${description})`)
                forEachOwnProperty(
                    log,
                    (timestamp, obj) => {
                        console.log(timestamp, obj)
                    }
                )
                console.groupEnd()
            }
        }
    );

    return jobMonitor
}
