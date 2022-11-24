import {DataStream} from "ufdl-ts-client/types/base";
import withPromiseParameters, {PromiseParameters} from "../util/typescript/async/withPromiseParameters";
import {blobSubject, BlobSubject} from "../util/rx/data/BlobSubject";
import {dataStreamSubject} from "../util/rx/data/DataStreamSubject";
import {immediateBehaviourSubject} from "../util/rx/immediate";
import {get_response_stream} from "ufdl-ts-client/util";

/**
 * Converts actions that download data from the server into
 * functions which return blob-subjects.
 *
 * @param action
 *          The action.
 * @return
 *          A function which returns a blob-subject.
 */
export default function forDownload<P extends unknown[]>(
    action: (...args: P) => Promise<DataStream>
): (...args: PromiseParameters<P>) => BlobSubject {
    return (...args) => {
        const dataStream = withPromiseParameters(action)(...args);
        const dsSubject = withPromiseParameters(dataStreamSubject)(dataStream);
        const subjectImmediate = immediateBehaviourSubject(dsSubject, new Uint8Array());
        return blobSubject(subjectImmediate);
    }
}

export function responseForDownload<P extends unknown[]>(
    action: (...args: P) => Promise<Response>
): (...args: PromiseParameters<P>) => BlobSubject {
    return forDownload(
        async (...args) => {
            return get_response_stream(await action(...args))
        }
    )
}
