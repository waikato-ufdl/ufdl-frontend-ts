import React, {MouseEventHandler, useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import Page from "../../Page";
import AnnotatorTopMenu, {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import NewDatasetPage from "../../NewDatasetPage";
import "./ObjectDetectionAnnotatorPage.css";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../../../../server/pk";
import useDerivedReducer from "../../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../../util/react/hooks/SimpleStateReducer";
import {UNCONTROLLED_KEEP} from "../../../../util/react/hooks/useControllableState";
import {IMAGE_CACHE_CONTEXT} from "../../../../App";
import {DetectedObjects} from "../../../../server/types/annotations";
import doAsync from "../../../../util/typescript/async/doAsync";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Image} from "../../../../server/types/data";
import {WithDefault} from "../../../../util/typescript/default";
import {BY_FILENAME} from "../../../../server/sorting";
import {ItemSelector, SELECTIONS} from "../../../../server/hooks/useDataset/selection";
import {ImageRenderer} from "../../../../server/components/image/ImageRenderer";
import DatasetOverview from "../../../../server/components/DatasetOverview";
import ObjectDetectionDatasetDispatch
    from "../../../../server/hooks/useObjectDetectionDataset/ObjectDetectionDatasetDispatch";
import useObjectDetectionDataset from "../../../../server/hooks/useObjectDetectionDataset/useObjectDetectionDataset";
import {ReactPictureAnnotation} from "react-picture-annotation";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import isBehaviourSubject from "../../../../util/rx/isBehaviourSubject";
import delayFunction from "../../../../util/typescript/delayFunction";
import {AddedFiles, addFilesRenderer, FileAnnotationModalRenderer} from "../../../../server/components/AddFilesButton";
import DataVideoWithFrameExtractor from "../../../../util/react/component/DataVideoWithFrameExtractor";
import selectFiles from "../../../../util/files/selectFiles";

type AnyPK = DatasetPK | ProjectPK | TeamPK | undefined

export const SORT_ORDERS = {
    "filename": BY_FILENAME
} as const

const SELECTED_PK_REDUCER = createSimpleStateReducer<AnyPK>();

export type ODAPProps = {
    lockedPK?: AnyPK,
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: ObjectDetectionDatasetDispatch | undefined,
        position: [number, number]
    ) => void
    onBack?: () => void
}

export default function ObjectDetectionAnnotatorPage(
    props: ODAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useDerivedReducer(
        SELECTED_PK_REDUCER,
        ([pk]) => pk,
        [props.lockedPK] as const
    );

    const dataset = useObjectDetectionDataset(
        ufdlServerContext,
        IMAGE_CACHE_CONTEXT,
        getDatasetPK(selectedPK)
    );

    const [sortFunction, setSortFunction] = useStateSafe<typeof SORT_ORDERS[keyof typeof SORT_ORDERS]>(
        () => SORT_ORDERS.filename
    );

    // Sub-page displays
    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe<boolean>(() => false);
    const [annotating, setAnnotating] = useStateSafe<string | undefined>(() => undefined);

    const newDatasetPageOnCreate = useDerivedState(
        () => (pk: DatasetPK) => {setSelectedPK(pk); setShowNewDatasetPage(false)},
        [setSelectedPK, setShowNewDatasetPage]
    )

    const newDatasetPageOnBack = useDerivedState(
        () => () => setShowNewDatasetPage(false),
        [setShowNewDatasetPage]
    )

    const largeImageOverlayOnClick: MouseEventHandler<HTMLImageElement> = useDerivedState(
        () => (event) => {
            setAnnotating(undefined);
            event.stopPropagation()
        },
        [setAnnotating]
    )

    const topMenuOnTeamChanged = useDerivedState(
        () => (_: any, pk: number | undefined) => {
            setSelectedPK(pk === undefined ? undefined : new TeamPK(pk));
        },
        [setSelectedPK]
    )

    const topMenuOnProjectChanged = useDerivedState(
        () => (_: any, pk: number | undefined) => {
            const teamPK = getTeamPK(selectedPK);
            setSelectedPK(pk === undefined ? teamPK : teamPK?.project(pk));
        },
        [selectedPK, setSelectedPK]
    )

    const imagesDisplayOnFileClicked = useDerivedState(
        () => (item: DatasetItem<Image, DetectedObjects>) => {
            setAnnotating(item.filename)
        },
        [setAnnotating]
    )

    const imagesDisplayOnFileSelected = useDerivedState(
        () => (item: DatasetItem<Image, DetectedObjects>) => {
            if (dataset !== undefined) dataset.toggleSelection(SELECTIONS.isFile(item.filename))
        },
        [dataset]
    )

    const imagesDisplayOnAddFiles = useDerivedState(
        () => (files: ReadonlyMap<string, [Blob, DetectedObjects]>) => {
            if (dataset !== undefined) doAsync(() => dataset.addFiles(files))
        },
        [dataset]
    )

    const annotatorTopMenuOnSelect = useDerivedState(
        () => {
            if (dataset === undefined) return undefined;
            return (select: ItemSelector<Image, DetectedObjects>) => {
                dataset.selectOnly(select)
            }
        },
        [dataset]
    )

    const itemSelectFragmentRenderer = useDerivedState(
        () => createObjectDetectionSelectFragmentRenderer(),
        []
    )

    const extraControls = useDerivedState(
        () => createObjectDetectionExtraControlsRenderer(),
        []
    )

    const filesDetectedObjectsModalRenderer: FileAnnotationModalRenderer<DetectedObjects> = useDerivedState(
        () => addFilesRenderer("multiple", () => []),
        []
    )

    const folderDetectedObjectsModalRenderer: FileAnnotationModalRenderer<DetectedObjects> = useDerivedState(
        () => addFilesRenderer("folder", () => []),
        []
    )

    const videoDetectedObjectsModalRenderer: FileAnnotationModalRenderer<DetectedObjects> = useDerivedState(
        () => async (onSubmit) => {
            const file = await selectFiles("single");
            if (file === null) return null;
            return <DataVideoWithFrameExtractor
                controls
                src={file}
                type={"jpeg"}
                onExtract={(image, time) => {
                    const filename = `${file?.name}.${time}.jpeg`;
                    onSubmit(new Map([[filename, [image, []]]]))
                }}
            />
        },
        []
    )

    const detectedObjectsRenderer = useDerivedState(
        () => () => undefined,
        []
    )

    const annotatorTopMenuOnDatasetChanged = useDerivedState(
        () => (_: any, pk: number | undefined) => {
            const projectPK = getProjectPK(selectedPK);
            setSelectedPK(pk === undefined ? projectPK : projectPK?.dataset(pk));
        },
        [selectedPK, setSelectedPK]
    )

    const annotatorTopMenuOnRequestNewDataset = useDerivedState(
        () => () => setShowNewDatasetPage(true),
        [setShowNewDatasetPage]
    )

    const annotatorTopMenuOnNext = useDerivedState(
        () => (position: [number, number]) => {
            if (props.onNext !== undefined) props.onNext(selectedPK, dataset, position)
        },
        [selectedPK, dataset]
    )

    const annotatorTopMenuNumSelected = useDerivedState(
        () => dataset === undefined
            ? [0, 0] as const
            : [dataset.numSelected, dataset.items.size] as const,
        [dataset?.items]
    )

    const [iAnnotations, setIAnnotations] = useDerivedReducer(
        createSimpleStateReducer(),
        () => annotating === undefined ? undefined : dataset?.asIAnnotations(annotating),
        [dataset, annotating]
    )

    // Create a delayed version of the annotation change function which doesn't
    // update the server until the user has stopped making changes for at least
    // half a second
    const delayedDatasetSetAnnotation = useDerivedState(
        () => dataset === undefined
            ? undefined
            : delayFunction(dataset.setAnnotation.bind(dataset), 500),
        [dataset]
    )

    const pictureAnnotatorOnChange = useDerivedState(
        () => (annotationData: IAnnotation[]) => {
            console.log(annotationData);
            if (delayedDatasetSetAnnotation === undefined || annotating === undefined) return;
            setIAnnotations(annotationData);
            delayedDatasetSetAnnotation(
                annotating,
                annotationData.map(
                    (value) => {
                        return {
                            x: Math.round(value.mark.x),
                            y: Math.round(value.mark.y),
                            width: Math.round(value.mark.width),
                            height: Math.round(value.mark.height),
                            label: value.comment || "UNLABELLED"
                        }
                    }
                )
            )
        },
        [delayedDatasetSetAnnotation, annotating]
    )

    const pictureAnnotatorOnSelect = useDerivedState(
        () => {
            let first = true;
            return (id: string | null) => {
                if (id === null) {
                    if (first) {
                        first = false
                    } else {
                        setAnnotating(undefined);
                    }
                }
            }
        },
        [annotating]
    )

    if (showNewDatasetPage) {
        return <NewDatasetPage
            domain={"Object Detection"} lockDomain
            licencePK={UNCONTROLLED_KEEP}
            isPublic={UNCONTROLLED_KEEP}
            from={selectedPK instanceof DatasetPK ? selectedPK.project : selectedPK}
            lockFrom={props.lockedPK === undefined ? undefined : props.lockedPK instanceof TeamPK ? "team" : "project"}
            onCreate={newDatasetPageOnCreate}
            onBack={newDatasetPageOnBack}
        />
    } else if (annotating !== undefined) {
        const item = dataset?.items.get(annotating);
        const cache = item?.data.value?.cache
        const handle = item?.data.value?.handle
        const url = cache?.getConverted(handle!)
        return <ReactPictureAnnotation
            onChange={pictureAnnotatorOnChange}
            width={window.innerWidth}
            height={window.innerHeight}
            image={isBehaviourSubject(url!) ? url.value : url!}
            onSelect={pictureAnnotatorOnSelect}
            annotationData={iAnnotations}
        />
    }

    return <Page className={"ObjectDetectionAnnotatorPage"}>
        <AnnotatorTopMenu
            domain={"Object Detection"}
            selectedPK={selectedPK}
            lockedPK={props.lockedPK}
            onTeamChanged={topMenuOnTeamChanged}
            onProjectChanged={topMenuOnProjectChanged}
            onDatasetChanged={annotatorTopMenuOnDatasetChanged}
            onRequestNewDataset={annotatorTopMenuOnRequestNewDataset}
            nextLabel={props.nextLabel}
            onNext={annotatorTopMenuOnNext}
            nextDisabled={dataset === undefined || !dataset.synchronised || props.onNext === undefined}
            onBack={props.onBack}
            className={"menuBar"}
            sortOrders={SORT_ORDERS}
            onSortChanged={setSortFunction}
            onSelect={annotatorTopMenuOnSelect}
            itemSelectFragmentRenderer={itemSelectFragmentRenderer}
            onDeleteSelected={dataset === undefined ? undefined : dataset.deleteSelectedFiles.bind(dataset)}
            extraControls={extraControls}
            numSelected={annotatorTopMenuNumSelected}
            onExtractSelected={undefined}
        />

        <DatasetOverview<Image, DetectedObjects>
            className={"ODDatasetOverview"}
            dataset={dataset?.items}
            evalDataset={undefined}
            renderData={ImageRenderer}
            renderAnnotation={detectedObjectsRenderer}
            onItemSelected={imagesDisplayOnFileSelected}
            onItemClicked={imagesDisplayOnFileClicked}
            onAddFiles={imagesDisplayOnAddFiles}
            sortFunction={sortFunction}
            itemClass={"ODDatasetItem"}
            addFilesSubMenus={{
                files: filesDetectedObjectsModalRenderer,
                folders: folderDetectedObjectsModalRenderer,
                video: videoDetectedObjectsModalRenderer
            }}
        />
    </Page>
}

function createObjectDetectionExtraControlsRenderer(
    // No parameters
): AnnotatorTopMenuExtraControlsRenderer {
    return () => {
        return <></>
    }
}

function createObjectDetectionSelectFragmentRenderer(
    // No parameters
): ItemSelectFragmentRenderer<Image, DetectedObjects> {
    return () => {
        return <></>
    }
}