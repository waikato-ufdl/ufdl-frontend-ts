import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import SelectDatasetPage from "../SelectDatasetPage";
import {FunctionComponentReturnType} from "../../../util/react/types";
import ImageClassificationAnnotatorPage from "../annotation/icap/ImageClassificationAnnotatorPage";
import Page from "../Page";
import useTheLoopStateMachine from "./hooks/useTheLoopStateMachine/useTheLoopStateMachine";
import WorkingPage from "./WorkingPage";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import RefineOrDoneModal from "./RefineOrDoneModal";
import tryGetBehaviourSubjectValue from "../../../util/rx/tryGetBehaviourSubjectValue";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {ClassColours} from "../../../server/util/classification";

export type TheLoopPageProps = {
    onBack?: () => void
}

export default function TheLoopPage(
    props: TheLoopPageProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const stateMachine = useTheLoopStateMachine(ufdlServerContext);

    const [classColours, setClassColours] = useStateSafe<ClassColours | undefined>(constantInitialiser(undefined));

    const refineOrDoneModal = useLocalModal();

    switch (stateMachine.state) {
        case "Selecting Primary Dataset":
            return <SelectDatasetPage
                onDatasetSelected={stateMachine.transitions.setSelected}
                onProjectSelected={stateMachine.transitions.setSelected}
                onTeamSelected={stateMachine.transitions.setSelected}
                from={stateMachine.data.from}
                lock={"project"}
                onBack={stateMachine.data.from === undefined ? props.onBack : stateMachine.transitions.back}
            />;

        case "Selecting Images":
            const latestModelPresent = stateMachine.data.modelOutputPK !== undefined;

            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.targetDataset}
                initialColours={classColours}
                nextLabel={latestModelPresent ? "Prelabel" : "Train"}
                onNext={(_, __, labelColours) => {
                    setClassColours(labelColours);
                    stateMachine.transitions.finishedSelectingImages();
                }}
                onBack={stateMachine.transitions.back}
            />;

        case "Merging Additional Images":
        case "Training":
        case "Evaluating":
        case "Prelabel":
            let progress = stateMachine.state === "Merging Additional Images" ?
                    0.0 :
                    tryGetBehaviourSubjectValue(
                        stateMachine.data.progress,
                        constantInitialiser(0.0)
                    );

            return <WorkingPage
                title={stateMachine.state}
                progress={progress}
                onCancel={stateMachine.transitions.cancel}
            />;

        case "Checking":
            return <>
                <ImageClassificationAnnotatorPage
                    lockedPK={stateMachine.data.evaluationDataset}
                    evalPK={stateMachine.data.primaryDataset}
                    initialColours={classColours}
                    nextLabel={"Next"}
                    onNext={(_, __, labelColours, position) => {
                        setClassColours(labelColours);
                        refineOrDoneModal.show(...position);
                    }}
                    onBack={stateMachine.transitions.back}
                />
                <RefineOrDoneModal
                    onRefine={() => {refineOrDoneModal.hide(); stateMachine.transitions.goodEnough(false)}}
                    onDone={() => {refineOrDoneModal.hide(); stateMachine.transitions.goodEnough(true)}}
                    position={refineOrDoneModal.position}
                    onCancel={() => refineOrDoneModal.hide()}
                />
            </>;

        case "Creating Addition Dataset":
            return <Page>
                {`${stateMachine.state}`}
            </Page>;

        case "User Fixing Categories":
            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.additionDataset}
                initialColours={classColours}
                nextLabel={"Accept"}
                onNext={(_, __, labelColours) => {
                    setClassColours(labelColours);
                    stateMachine.transitions.finishedFixing();
                }}
                onBack={stateMachine.transitions.back}
            />;

        case "Finished":
            return <Page>
                {"Finished!"}
                <button onClick={stateMachine.transitions.download}>Download</button>
                <button
                    onClick={() => {
                        stateMachine.transitions.reset();
                        if (props.onBack !== undefined) props.onBack();
                    }}
                >
                    Back
                </button>
            </Page>;

        case "Error":
            return <Page>
                {"Error"}
                {String(stateMachine.data.reason)}
                <button onClick={stateMachine.transitions.reset}>Back</button>
            </Page>


    }
}
