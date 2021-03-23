import {discard} from "../discard";
import asAsync from "./asAsync";

/**
 * Executes some function asynchronously.
 *
 * @param body
 *          The body of the function to execute.
 */
export default function doAsync(
    body: () => any
): void {
    discard(asAsync(body)());
}
