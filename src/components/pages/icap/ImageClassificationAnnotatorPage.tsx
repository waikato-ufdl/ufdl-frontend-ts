import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import Page from "../Page";
import ICAPTopMenu from "./ICAPTopMenu";
import ImagesDisplay from "./ImagesDisplay";
import ICAPBottomMenu from "./ICAPBottomMenu";
import {LabelColour, LabelColours} from "./labels/LabelColours";
import LabelColourPickerPage from "./labels/LabelColourPickerPage";
import {mapAny} from "../../../util/map";
import useImageClassificationDataset, {ImageClassificationDatasetMutator} from "../../../server/hooks/useImageClassificationDataset/useImageClassificationDataset";
import {DataImage} from "../../../image/DataImage";
import {BehaviorSubject} from "rxjs";
import useLabelColours from "./labels/useLabelColours";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import NewDatasetPage from "../NewDatasetPage";
import "./ImageClassificationAnnotatorPage.css";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../../../server/pk";
import useDerivedReducer from "../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../util/react/hooks/SimpleStateReducer";
import {Optional} from "ufdl-js-client/util";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {SORT_FUNCTIONS, SortOrder} from "./sorting";
import {toggleSelection} from "../../../server/hooks/useImageClassificationDataset/actions/SELECTIONS";

type AnyPK = DatasetPK | ProjectPK | TeamPK | undefined

export type ICAPProps = {
    lockedPK?: AnyPK,
    evalPK?: DatasetPK,
    initialLabelColours?: LabelColours
    nextLabel?: string
    onNext?: (
        selectedPK: AnyPK,
        dataset: Optional<ImageClassificationDatasetMutator>,
        labelColours: LabelColours
    ) => void
    onBack?: () => void
}

const selectedPKReducer = createSimpleStateReducer<AnyPK>();

export default function ImageClassificationAnnotatorPage(
    props: ICAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useDerivedReducer(
        selectedPKReducer,
        ([pk]) => pk,
        [props.lockedPK] as const
    );

    const dataset = useImageClassificationDataset(ufdlServerContext, getDatasetPK(selectedPK), props.evalPK);

    const evalDataset = useImageClassificationDataset(ufdlServerContext, props.evalPK);

    const labelColoursDispatch = useLabelColours(dataset?.state, props.initialLabelColours);

    const [sortOrder, setSortOrder] = useStateSafe<SortOrder>(constantInitialiser("filename"));

    // Sub-page displays
    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe<boolean>(() => false);
    const [showLabelColourPickerPage, setShowLabelColourPickerPage] = useStateSafe<boolean>(() => false);
    const [showLargeImageOverlay, setShowLargeImageOverlay] = useStateSafe<BehaviorSubject<Blob> | undefined>(() => undefined);

    if (showNewDatasetPage) {
        return <NewDatasetPage
            domain={"ic"}
            lockedPK={props.lockedPK instanceof DatasetPK ? undefined : props.lockedPK}
            onCreate={(pk) => {setSelectedPK(pk); setShowNewDatasetPage(false)}}
            onBack={() => setShowNewDatasetPage(false)}
        />
    } else if (showLabelColourPickerPage) {
        return <LabelColourPickerPage
            labelColours={labelColoursDispatch.state}
            onColourChanged={
                (changedLabel, _, newColour) => {
                    const colourInUse = (label: string, colour: LabelColour) =>
                        label !== changedLabel && colour === newColour;

                    if (mapAny(labelColoursDispatch.state, colourInUse)) {
                        return;
                    }

                    labelColoursDispatch.set(changedLabel, newColour);
                }
            }
            onNewLabel={(label) => labelColoursDispatch.add(label)}
            onLabelDeleted={(label) => {
                labelColoursDispatch.delete(label);
                if (dataset !== undefined) dataset.state.forEach(
                    (item, filename) => {
                        if (item.annotations === label) dataset.setLabel(filename, undefined);
                    }
                )
            }}
            onBack={() => setShowLabelColourPickerPage(false)}
        />
    } else if (showLargeImageOverlay !== undefined) {
        return <DataImage
            src={showLargeImageOverlay}
            onClick={
                (event) => {
                    setShowLargeImageOverlay(undefined);
                    event.stopPropagation()
                }
            }
        />
    }

    return <Page className={"ImageClassificationAnnotatorPage"}>
        <ICAPTopMenu
            selectedPK={selectedPK}
            lockedPK={props.lockedPK}
            onTeamChanged={
                (_, pk) => {
                    setSelectedPK(pk === undefined ? undefined : new TeamPK(pk));
                }
            }
            onProjectChanged={
                (_, pk) => {
                    const teamPK = getTeamPK(selectedPK);
                    setSelectedPK(pk === undefined ? teamPK : teamPK?.project(pk));
                }
            }
            onDatasetChanged={
                (_, pk) => {
                    const projectPK = getProjectPK(selectedPK);
                    setSelectedPK(pk === undefined ? projectPK : projectPK?.dataset(pk));
                }
            }
            onRequestNewDataset={() => setShowNewDatasetPage(true)}
            nextLabel={props.nextLabel}
            onNext={() => {
                if (props.onNext !== undefined) props.onNext(selectedPK, dataset, labelColoursDispatch.state)
            }}
            nextDisabled={dataset === undefined || !dataset.synchronised}
            onBack={props.onBack}
        />

        <ImagesDisplay
            dataset={dataset === undefined ? undefined : dataset.state}
            evalDataset={evalDataset === undefined ? undefined: evalDataset.state}
            onFileSelected={(filename) => {if (dataset !== undefined) dataset.select(toggleSelection(filename))}}
            onLabelChanged={
                (filename, _, newLabel) => {
                    if (dataset !== undefined) dataset.setLabel(filename, newLabel);
                }
            }
            onFileClicked={(_, file) => setShowLargeImageOverlay(file.data)}
            onAddFiles={(files) => {if (dataset !== undefined) dataset.addFiles(files)}}
            labelColours={labelColoursDispatch.state}
            sortFunction={SORT_FUNCTIONS[sortOrder]}
        />

        <ICAPBottomMenu
            onDeleteSelect={dataset === undefined ? undefined : dataset.deleteSelectedFiles.bind(dataset)}
            onSelect={dataset === undefined ? undefined : dataset.select.bind(dataset)}
            onRequestLabelColourPickerOverlay={() => setShowLabelColourPickerPage(true)}
            onRelabelSelected={dataset !== undefined ? dataset.relabelSelectedFiles.bind(dataset) : undefined}
            onSortChanged={setSortOrder}
            labelColours={labelColoursDispatch.state}
            evalDataset={evalDataset?.state}
        />
    </Page>
}
