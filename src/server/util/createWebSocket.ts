import {TransitionHandlers} from "../types/TransitionHandlers";

/**
 * Creates a web-socket to listen for phase transitions of the given
 * job.
 *
 * @param pk
 *          The primary key of the job to listen to.
 * @param handlers
 *          A set of handlers for for the different transitions
 *          a job may go through.
 * @return
 *          The connected web-socket.
 */
export default function createWebSocket(
    pk: number,
    handlers: TransitionHandlers
): WebSocket {
    // Connect to the web-socket URL for the job
    const webSocket = new WebSocket(`ws://${window.location.host}/ws/job/${pk}`);

    // Create a closure to track if the websocket was closed by choice
    let manuallyClosed: boolean = false;

    // Create a callback which dispatches messages to the correct transition handler
    webSocket.onmessage = function(e) {
        // Parse the JSON data of the transition message
        const data = JSON.parse(e.data);

        // Log the message to the console
        console.debug(data);

        // Get the name of the handler for the transition
        const handlerName = `on_${data.transition as string}` as keyof TransitionHandlers;

        // Get the handler for the transition
        const handler = handlers[handlerName];

        // Execute the handler if one was provided
        if (handler !== undefined) handler(data);

        // If no more transitions are expected, close the socket
        if (data.transition === "finish" || data.transition === "cancel") {
            manuallyClosed = true;
            this.close();
        }

    };

    // Create a close callback which informs the handler if the web-socket closes
    // unexpectedly
    webSocket.onclose = function() {
        // If we closed the web-socket ourselves, no need to panic
        if (manuallyClosed) return;

        // Get the error handler
        const errorHandler = handlers.on_error;

        // Post an error that the web-socket closed unexpectedly
        if (errorHandler !== undefined) errorHandler({error: 'web-socket closed unexpectedly'});
    };

    return webSocket;
}
