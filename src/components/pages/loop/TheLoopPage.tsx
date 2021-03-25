import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import SelectDatasetPage from "../SelectDatasetPage";
import {FunctionComponentReturnType} from "../../../util/react/types";
import ImageClassificationAnnotatorPage from "../icap/ImageClassificationAnnotatorPage";
import Page from "../Page";
import {LabelColours} from "../icap/labels/LabelColours";
import useTheLoopStateMachine from "./hooks/useTheLoopStateMachine/useTheLoopStateMachine";
import WorkingPage from "./WorkingPage";

export type TheLoopPageProps = {
    onBack?: () => void
}

export default function TheLoopPage(
    props: TheLoopPageProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const stateMachine = useTheLoopStateMachine(ufdlServerContext);

    const [labelColours, setLabelColours] = useStateSafe<LabelColours>(() => new Map());

    switch (stateMachine.state) {
        case "Selecting Primary Dataset":
            return <SelectDatasetPage
                onSelected={(pk) => stateMachine.transitions.primaryDatasetSelected(pk)}
                onBack={props.onBack}
            />;

        case "Selecting Images":
            const latestModelPresent = stateMachine.data.modelOutputPK !== undefined;

            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.targetDataset}
                initialLabelColours={labelColours}
                nextLabel={latestModelPresent ? "Prelabel" : "Train"}
                onNext={(_, __, labelColours) => {
                    setLabelColours(labelColours);
                    stateMachine.transitions.finishedSelectingImages();
                }}
                onBack={props.onBack}
            />;

        case "Merging Additional Images":
        case "Training":
        case "Evaluating":
        case "Prelabel":
            const progress = stateMachine.state === "Merging Additional Images" ?
                0.0 :
                stateMachine.data.progress.getValue();

            return <WorkingPage
                title={stateMachine.state}
                progress={progress}
                onCancel={stateMachine.transitions.cancel}
            />;

        case "Checking":
            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.evaluationDataset}
                initialLabelColours={labelColours}
                nextLabel={"Happy?"}
                onNext={(_, __, labelColours) => {
                    setLabelColours(labelColours);
                    stateMachine.transitions.goodEnough(false);
                }}
                onBack={() => stateMachine.transitions.goodEnough(true)}
            />;

        case "Creating Addition Dataset":
            return <Page>
                {`${stateMachine.state}`}
            </Page>;

        case "User Fixing Categories":
            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.additionDataset}
                initialLabelColours={labelColours}
                nextLabel={"Finished Fixing"}
                onNext={(_, __, labelColours) => {
                    setLabelColours(labelColours);
                    stateMachine.transitions.finishedFixing();
                }}
                onBack={props.onBack}
            />;

        case "Finished":
            return <Page>
                <p>Finished!</p>
                <button onClick={stateMachine.transitions.download}>Download</button>
                <button onClick={props.onBack}>Back</button>
            </Page>;

        case "Error":
            return <Page>
                <p>Error</p>
                {stateMachine.data.reason.toString()}
                <button onClick={stateMachine.transitions.reset}>Back</button>
            </Page>


    }
}
