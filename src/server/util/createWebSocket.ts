import {TransitionHandlers} from "../types/TransitionHandlers";

export default function createWebSocket(
    pk: number,
    handlers: TransitionHandlers
) {
    const webSocket = new WebSocket(`ws://${window.location.host}/ws/job/${pk}`);

    let manuallyClosed: boolean = false;

    webSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);

        console.log(data);

        const handlerName = `on_${data.transition as string}` as keyof TransitionHandlers;

        const handler = handlers[handlerName];

        if (handler !== undefined) handler(data);

        if (data.transition === "finish" || data.transition === "error") {
            manuallyClosed = true;
            this.close();
        }

    };

    webSocket.onclose = function() {
        if (!manuallyClosed) {
            const errorHandler = handlers.on_error;
            if (errorHandler !== undefined) errorHandler({error: 'web-socket closed unexpectedly'});
        }
    };

    return webSocket;
}
