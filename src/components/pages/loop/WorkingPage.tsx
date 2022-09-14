import {FunctionComponentReturnType} from "../../../util/react/types";
import {BehaviorSubject} from "rxjs";
import Page from "../Page";
import {useObservable} from "../../../util/react/hooks/useObservable";
import useArrayState from "../../../util/react/hooks/useArrayState";
import {useEffect} from "react";

export type WorkingPageProps = {
    title: string,
    progress: BehaviorSubject<[number, string | undefined]> | number
    onCancel: () => void
}

export default function WorkingPage(
    props: WorkingPageProps
): FunctionComponentReturnType {

    // If tracking an observable, update when we get new progress information
    useObservable(props.progress instanceof BehaviorSubject ? props.progress : undefined)

    // Extract the progress value
    const progress: [number, string | undefined] = props.progress instanceof BehaviorSubject ?
        props.progress.value :
        [props.progress, undefined];

    const message = progress[1]

    // Array of progress messages received
    const messages = useArrayState<string>()

    useEffect(
        () => {
            if (message !== undefined)
                messages.push(message)
        },
        [message]
    )

    const messageElements = messages.map(
        message => <p>{message}</p>
    )

    return <Page>
        {props.title}: {(progress[0] * 100).toFixed(2)}%
        <button onClick={props.onCancel}>
            Cancel
        </button>
        {messageElements}
    </Page>
}
