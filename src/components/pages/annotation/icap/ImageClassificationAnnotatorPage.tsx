import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import Page from "../../Page";
import ICAPTopMenu from "./ICAPTopMenu";
import ImagesDisplay from "./ImagesDisplay";
import ICAPBottomMenu from "./ICAPBottomMenu";
import {mapAny, mapMap} from "../../../../util/map";
import useImageClassificationDataset
    from "../../../../server/hooks/useImageClassificationDataset/useImageClassificationDataset";
import DataImage from "../../../../util/react/component/DataImage";
import {BehaviorSubject} from "rxjs";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import NewDatasetPage from "../../NewDatasetPage";
import "./ImageClassificationAnnotatorPage.css";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../../../../server/pk";
import useDerivedReducer from "../../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../../util/react/hooks/SimpleStateReducer";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import {SORT_FUNCTIONS, SortOrder} from "./sorting";
import {UNCONTROLLED_KEEP} from "../../../../util/react/hooks/useControllableState";
import ImageClassificationDatasetDispatch
    from "../../../../server/hooks/useImageClassificationDataset/ImageClassificationDatasetDispatch";
import {IMAGE_CACHE_CONTEXT} from "../../../../App";
import {NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {toggleSelection} from "../../../../server/hooks/useDataset/selection/selections";
import {ClassColour, ClassColours, storeColoursInContext} from "../../../../server/util/classification";
import useClassColours from "../../../../server/hooks/useClassColours";
import ClassColourPickerPage from "../../ClassColourPickerPage";

type AnyPK = DatasetPK | ProjectPK | TeamPK | undefined

export type ICAPProps = {
    lockedPK?: AnyPK,
    evalPK?: DatasetPK,
    initialColours?: ClassColours
    nextLabel?: string
    onNext?: (
        selectedPK: AnyPK,
        dataset: ImageClassificationDatasetDispatch | undefined,
        labelColours: ClassColours,
        position: [number, number]
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

    const dataset = useImageClassificationDataset(
        ufdlServerContext,
        IMAGE_CACHE_CONTEXT,
        getDatasetPK(selectedPK)
    );

    const evalDataset = useImageClassificationDataset(
        ufdlServerContext,
        IMAGE_CACHE_CONTEXT,
        props.evalPK
    );

    const classColoursDispatch = useClassColours(dataset?.items, props.initialColours);

    const [sortOrder, setSortOrder] = useStateSafe<SortOrder>(constantInitialiser("filename"));

    // Sub-page displays
    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe<boolean>(() => false);
    const [showLabelColourPickerPage, setShowLabelColourPickerPage] = useStateSafe<boolean>(() => false);
    const [showLargeImageOverlay, setShowLargeImageOverlay] = useStateSafe<BehaviorSubject<string> | string | undefined>(() => undefined);

    if (showNewDatasetPage) {
        return <NewDatasetPage
            domain={"ic"}
            licencePK={UNCONTROLLED_KEEP}
            isPublic={UNCONTROLLED_KEEP}
            from={props.lockedPK instanceof DatasetPK ? undefined : props.lockedPK}
            onCreate={(pk) => {setSelectedPK(pk); setShowNewDatasetPage(false)}}
            onBack={() => setShowNewDatasetPage(false)}
        />
    } else if (showLabelColourPickerPage) {
        return <ClassColourPickerPage
            colours={classColoursDispatch.state}
            onColourChanged={
                (changedLabel, _, newColour) => {
                    const colourInUse = (label: string, colour: ClassColour) =>
                        label !== changedLabel && colour === newColour;

                    if (mapAny(classColoursDispatch.state, colourInUse)) {
                        return;
                    }

                    classColoursDispatch.set(changedLabel, newColour);
                }
            }
            onNewClass={(classification) => classColoursDispatch.add(classification)}
            onClassDeleted={(classification) => {
                classColoursDispatch.delete(classification);
                if (dataset !== undefined) dataset.setAnnotations(
                    mapMap(
                        dataset.items,
                        (filename, item) => item.annotations === classification
                            ? [[filename, NO_CLASSIFICATION]]
                            : []
                    )
                )
            }}
            onBack={() => {
                storeColoursInContext(classColoursDispatch.state, ufdlServerContext);
                setShowLabelColourPickerPage(false)
            }}
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
            onNext={(position) => {
                if (props.onNext !== undefined) props.onNext(selectedPK, dataset, classColoursDispatch.state, position)
            }}
            nextDisabled={dataset === undefined || !dataset.synchronised}
            onBack={props.onBack}
        />

        <ImagesDisplay
            dataset={dataset?.items}
            evalDataset={evalDataset?.items}
            onFileSelected={(filename) => {if (dataset !== undefined) dataset.select(toggleSelection(filename))}}
            onReclassify={
                (filename, _, newLabel) => {
                    if (dataset !== undefined) dataset.setAnnotation(filename, newLabel);
                }
            }
            onFileClicked={(_, file) => setShowLargeImageOverlay(file.dataCache.getConverted(file.dataHandle))}
            onAddFiles={(files) => {if (dataset !== undefined) dataset.addFiles(files)}}
            colours={classColoursDispatch.state}
            sortFunction={SORT_FUNCTIONS[sortOrder]}
        />

        <ICAPBottomMenu
            onDeleteSelect={dataset === undefined ? undefined : dataset.deleteSelectedFiles.bind(dataset)}
            onSelect={dataset === undefined ? undefined : dataset.select.bind(dataset)}
            onRequestLabelColourPickerOverlay={() => setShowLabelColourPickerPage(true)}
            onRelabelSelected={dataset?.setAnnotationsForSelected?.bind(dataset)}
            onSortChanged={setSortOrder}
            colours={classColoursDispatch.state}
            evalDataset={evalDataset?.items}
            numSelected={dataset === undefined ? [0, 0] : [dataset.numSelected, dataset.items.size]}
        />
    </Page>
}
