import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import isPromise from "../../../../../util/typescript/async/isPromise";
import {discard} from "../../../../../util/typescript/discard";
import {cancel_job} from "ufdl-js-client/functional/core/jobs/job";

export function silentlyCancelJob(
    context: UFDLServerContext,
    jobPK: number | Promise<number>
): void {
    console.trace();
    if (isPromise(jobPK)) {
        jobPK.then((jobPK) => discard(cancel_job(context, jobPK)));
    } else {
        discard(cancel_job(context, jobPK));
    }
}
