import {BehaviorSubject} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {CreateJobSpec} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {create_job} from "ufdl-ts-client/functional/core/jobs/job_template";
import {handleErrorResponse} from "../error/handleErrorResponse";
import {ERROR_RESPONSE_HANDLERS} from "../error/ERROR_RESPONSE_HANDLERS";
import {JobTransitionMessage} from "ufdl-ts-client/types/core/jobs/job";
import {Empty} from "../../util/typescript/types/Empty";
import {monitorJob} from "./monitorJob";

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

