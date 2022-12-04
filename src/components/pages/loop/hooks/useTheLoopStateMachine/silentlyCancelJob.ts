import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import isPromise from "../../../../../util/typescript/async/isPromise";
import {discard} from "../../../../../util/typescript/discard";
import {cancel_job} from "ufdl-ts-client/functional/core/jobs/job";

export function silentlyCancelJob(
    context: UFDLServerContext,
    jobPK: number | Promise<number>
): void {
    if (isPromise(jobPK)) {
        jobPK.then((jobPK) => discard(cancel_job(context, jobPK)));
    } else {
        discard(cancel_job(context, jobPK));
    }
}

export function silentlyCancelJobOnTransitionFailure(
    context: UFDLServerContext,
    jobPK: number | Promise<number>
): (success: boolean) => void {
    return success => {
        if (!success) silentlyCancelJob(context, jobPK)
    }
}
