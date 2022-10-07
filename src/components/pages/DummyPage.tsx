import React, {ReactElement, useContext, useReducer} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import selectFiles from "../../util/files/selectFiles";
import DataVideoWithFrameExtractor from "../../util/react/component/DataVideoWithFrameExtractor";
import saveFile from "../../util/files/saveFile";
import {BackButton} from "../../util/react/component/BackButton";
import PingButton from "../../server/components/PingButton";

export type DummyPageProps = {
    pings: number
    onBack?: () => void
}

export default function DummyPage(
    props: DummyPageProps
): ReactElement | null {

    const [pings, incrementPings] = useReducer(
        (currentState: number) => currentState + 1,
        null,
        () => props.pings
    );

    const [video, setVideo] = useStateSafe<Blob | undefined>(
        () => undefined
    )

    const context = useContext(UFDL_SERVER_REACT_CONTEXT);

    const videoElement = video === undefined ?
        <button
            onClick={
                async () => {
                    const file = await selectFiles("single")
                    if (file !== null) setVideo(file)
                }
            }>
            Select video
        </button> :
        <DataVideoWithFrameExtractor
            controls
            src={video}
            type={"jpeg"}
            onExtract={(image, time) => saveFile(`image-${time}.jpeg`, image)}
        />

    return <Page className={"DummyPage"}>
        {`Logged in to ${context.host} as ${context.username}`}
        <div>
            <BackButton onBack={props.onBack} />
            <PingButton
                onSuccess={incrementPings}
                onFailure={(reason) => window.alert(reason)}
                onClick={(_) => window.alert("Ping!") }
            >
                {`Pings: ${pings.toString()}`}
            </PingButton>
        </div>
        <div>
            {videoElement}
        </div>
    </Page>

}
