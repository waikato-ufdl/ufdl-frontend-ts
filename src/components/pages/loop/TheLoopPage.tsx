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
import {constantInitialiser} from "../../../util/typescript/initialisers";
import RefineOrDoneModal from "./RefineOrDoneModal";

export type TheLoopPageProps = {
    onBack?: () => void
}

export default function TheLoopPage(
    props: TheLoopPageProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const stateMachine = useTheLoopStateMachine(ufdlServerContext);

    const [labelColours, setLabelColours] = useStateSafe<LabelColours | undefined>(constantInitialiser(undefined));

    const [modalPosition, setModalPosition] = useStateSafe<[number, number] | undefined>(constantInitialiser(undefined));

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
                initialLabelColours={labelColours}
                nextLabel={latestModelPresent ? "Prelabel" : "Train"}
                onNext={(_, __, labelColours) => {
                    setLabelColours(labelColours);
                    stateMachine.transitions.finishedSelectingImages();
                }}
                onBack={stateMachine.transitions.back}
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
            return <>
                <ImageClassificationAnnotatorPage
                    lockedPK={stateMachine.data.evaluationDataset}
                    evalPK={stateMachine.data.primaryDataset}
                    initialLabelColours={labelColours}
                    nextLabel={"Next"}
                    onNext={(_, __, labelColours, position) => {
                        setLabelColours(labelColours);
                        setModalPosition(position);
                    }}
                    onBack={stateMachine.transitions.back}
                />
                <RefineOrDoneModal
                    onRefine={() => {setModalPosition(undefined); stateMachine.transitions.goodEnough(false)}}
                    onDone={() => {setModalPosition(undefined); stateMachine.transitions.goodEnough(true)}}
                    position={modalPosition}
                    onCancel={() => setModalPosition(undefined)}
                />
            </>;

        case "Creating Addition Dataset":
            return <Page>
                {`${stateMachine.state}`}
            </Page>;

        case "User Fixing Categories":
            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.additionDataset}
                initialLabelColours={labelColours}
                nextLabel={"Accept"}
                onNext={(_, __, labelColours) => {
                    setLabelColours(labelColours);
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
                {stateMachine.data.reason.toString()}
                <button onClick={stateMachine.transitions.reset}>Back</button>
            </Page>


    }
}
