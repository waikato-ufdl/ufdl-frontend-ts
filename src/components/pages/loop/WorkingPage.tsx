import {FunctionComponentReturnType} from "../../../util/react/types";
import {BehaviorSubject} from "rxjs";
import Page from "../Page";

export type WorkingPageProps = {
    title: string,
    progress: BehaviorSubject<number> | number
}

export default function WorkingPage(
    props: WorkingPageProps
): FunctionComponentReturnType {

    const progress = props.progress instanceof BehaviorSubject ?
        props.progress.value :
        props.progress;

    return <Page>
        {props.title}: {progress * 100}%
    </Page>
}
