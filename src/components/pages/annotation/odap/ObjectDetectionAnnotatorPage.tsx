import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {AnyPK, getDatasetPK} from "../../../../server/pk";
import {Classification, DetectedObjects, NO_ANNOTATION} from "../../../../server/types/annotations";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Image, ImageOrVideo} from "../../../../server/types/data";
import {DEFAULT, WithDefault} from "../../../../util/typescript/default";
import ObjectDetectionDatasetDispatch
    from "../../../../server/hooks/useObjectDetectionDataset/ObjectDetectionDatasetDispatch";
import useObjectDetectionDataset from "../../../../server/hooks/useObjectDetectionDataset/useObjectDetectionDataset";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {addFilesRenderer, FileAnnotationModalRenderer} from "../../../../server/components/AddFilesButton";
import DataVideoWithFrameExtractor from "../../../../util/react/component/DataVideoWithFrameExtractor";
import selectFiles from "../../../../util/files/selectFiles";
import AnnotatorPage from "../AnnotatorPage";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import {ImageOrVideoRenderer} from "../../../../server/components/image/ImageOrVideoRenderer";
import getVideoStats from "../../../../util/getVideoStats";
import getImageStats from "../../../../util/getImageStats";
import passOnUndefined from "../../../../util/typescript/functions/passOnUndefined";
import "./ObjectDetectionAnnotatorPage.css"
import UNREACHABLE from "../../../../util/typescript/UNREACHABLE";
import ifDefined from "../../../../util/typescript/ifDefined";
import {identity} from "../../../../util/identity";
import pass from "../../../../util/typescript/functions/pass";
import {SubmitCancelPictureOrVideoAnnotation} from "../../../../util/react/component/SubmitCancelPictureOrVideoAnnotation";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";
import {isArray} from "../../../../util/typescript/arrays/isArray";
import {mapToArray} from "../../../../util/map";
import arrayFlatten from "../../../../util/typescript/arrays/arrayFlatten";
import {iAnnotationsToAnnotations} from "../../../../util/IAnnotations";
import {isNotEmpty} from "../../../../util/typescript/arrays/isNotEmpty";
import createClassificationRenderer from "../../../../server/components/classification/createClassificationRenderer";
import {AnnotationRenderer} from "../../../../server/components/DatasetItem";
import {DatasetDispatchItemAnnotationType} from "../../../../server/hooks/useDataset/types";
import {Absent, Possible} from "../../../../util/typescript/types/Possible";
import hasData from "../../../../util/react/query/hasData";
import mapQueryResult from "../../../../util/react/query/mapQueryResult";
import {RefetchOptions, RefetchQueryFilters} from "react-query/types/core/types";

export type ODAPProps = {
    lockedPK?: AnyPK,
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: ObjectDetectionDatasetDispatch | undefined,
        position: [number, number]
    ) => void
    onBack?: () => void,
    queryDependencies?: readonly unknown[],
    evalQueryDependencies?: readonly unknown[]
}

export default function ObjectDetectionAnnotatorPage(
    props: ODAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useStateSafe(constantInitialiser(props.lockedPK))

    const dataset = useObjectDetectionDataset(
        ufdlServerContext,
        getDatasetPK(selectedPK),
        props.queryDependencies
    );

    // Sub-page displays
    const [annotating, setAnnotating] = useStateSafe<string | undefined>(() => undefined);

    const imagesDisplayOnFileClicked = useDerivedState(
        () => (item: DatasetItem<unknown, unknown>) => {
            setAnnotating(item.filename)
        },
        [setAnnotating]
    )

    const [itemSelectFragmentRenderer] = useStateSafe(createObjectDetectionSelectFragmentRenderer)

    const [extraControls] = useStateSafe(createObjectDetectionExtraControlsRenderer)

    const [filesDetectedObjectsModalRenderer] = useStateSafe(
        () => addFilesRenderer<ImageOrVideo, DetectedObjects>(
            "multiple",
            (file) => imageOrVideoFromFile(file, false),
            () => NO_ANNOTATION
        )
    )

    const [folderDetectedObjectsModalRenderer] = useStateSafe(
        () => addFilesRenderer<ImageOrVideo, DetectedObjects>(
            "folder",
            async (file) => imageOrVideoFromFile(file, false),
            () => NO_ANNOTATION
        )
    )

    const [videoDetectedObjectsModalRenderer] = useStateSafe(
        () => addFilesRenderer<ImageOrVideo, DetectedObjects>(
            "multiple",
            (file) => imageOrVideoFromFile(file, true),
            () => NO_ANNOTATION
        )
    )

    const [videoFramesDetectedObjectsModalRenderer] = useStateSafe<FileAnnotationModalRenderer<ImageOrVideo, DetectedObjects>>(
        () => async (onSubmit) => {
            // Get the user to select a single video file, aborting if the user doesn't
            const file = await selectFiles("single")
            if (file === null) return null
            console.log(`Selected video '${file.name}' for frame-extraction`)

            // Create a frame-extractor to manage the frame selection
            return <DataVideoWithFrameExtractor
                controls
                src={file}
                type={"jpeg"}
                onExtract={
                    async (image, time) => {
                        // Format a filename for the frame-image
                        const filename = `${file.name}.${time}.jpeg`;

                        // Submit the frame as an image with no annotations
                        onSubmit(
                            new Map(
                                [[
                                    filename,
                                    [await imageOrVideoFromFile(image, false), NO_ANNOTATION]
                                ]]
                            )
                        )
                        console.log(`Submitted frame at ${time} from '${file.name}' as '${filename}'`)
                    }
                }
            />
        }
    )

    const detectedObjectsRenderer: AnnotationRenderer<DatasetDispatchItemAnnotationType<DetectedObjects>> = useDerivedState(
        () => {
            const colours = new Map([["has", "green"], ["not", "red"], ["loading", "blue"]])
            const classificationRenderer = createClassificationRenderer(colours, pass)
            function mapResult(result: DatasetDispatchItemAnnotationType<DetectedObjects>): DatasetDispatchItemAnnotationType<Classification> {
                return {
                    ...result,
                    data: !hasData(result) ? "loading" : result.data === NO_ANNOTATION ? "not" : "has",
                    refetch<TPageData>(options?: RefetchOptions & RefetchQueryFilters<TPageData>) {
                        return result.refetch(options).then(
                            value => {
                                return mapQueryResult(value, (value) => value === NO_ANNOTATION ? "not" : "has")
                            }
                        )
                    }
                }
            }
            return (
                filename: string,
                selected: boolean,
                annotation: DatasetDispatchItemAnnotationType<DetectedObjects>,
                _evalAnnotation: Possible<DatasetDispatchItemAnnotationType<DetectedObjects>>
            ) => {
                return classificationRenderer(
                    filename,
                    selected,
                    mapResult(annotation),
                    Absent
                )
            }
        },
        []
    )

    const pictureAnnotatorOnSubmit = useDerivedState(
        ([dataset, annotating]) => (annotationData: IAnnotation[] | ReadonlyMap<number, IAnnotation<IRectShapeData>[]>) => {
            if (dataset === undefined || annotating === undefined) {
                UNREACHABLE("This callback should never be called without 'dataset' and 'annotating' defined");
            }

            const annotations = isArray(annotationData)
                ? iAnnotationsToAnnotations(annotationData)
                : arrayFlatten(
                    mapToArray(
                        annotationData,
                        (time, annotations) => {
                            return ifDefined(
                                iAnnotationsToAnnotations(annotations, time),
                                identity,
                                constantInitialiser([])
                            )
                        }
                    )
                )

            dataset.setAnnotationsForFile(
                annotating,
                isNotEmpty(annotations) ? annotations : NO_ANNOTATION
            )
        },
        [dataset, annotating] as const
    )

    const pictureAnnotatorOnCancel = useDerivedState(
        ([setAnnotating]) => () => {
            setAnnotating(undefined);
        },
        [setAnnotating]
    )

    if (annotating !== undefined) {
        return <SubmitCancelPictureOrVideoAnnotation
            onSubmit={pictureAnnotatorOnSubmit}
            width={window.innerWidth}
            height={window.innerHeight}
            item={dataset?.get(annotating)!}
            onCancel={pictureAnnotatorOnCancel}
            defaultAnnotationSize={[20, 20]}
            onChange={pass}
            onSelect={pass}
        />
    }

    return <AnnotatorPage
        className={"ObjectDetectionAnnotatorPage"}
        domain={"Object Detection"}
        nextLabel={props.nextLabel}
        sortOrders={DEFAULT}
        renderData={ImageOrVideoRenderer}
        renderAnnotation={detectedObjectsRenderer}
        onItemClicked={imagesDisplayOnFileClicked}
        addFilesSubMenus={{
            files: filesDetectedObjectsModalRenderer,
            folders: folderDetectedObjectsModalRenderer,
            video: videoDetectedObjectsModalRenderer,
            "video frames": videoFramesDetectedObjectsModalRenderer
        }}
        extraControls={extraControls}
        itemSelectFragmentRenderer={itemSelectFragmentRenderer}
        onSelectedPKChanged={setSelectedPK}
        selectedPK={selectedPK}
        dataset={dataset}
        evalDataset={undefined} // TODO: Implement eval datasets
        lockedPK={props.lockedPK}
        onBack={props.onBack}
        onNext={(selectedPK, position) => passOnUndefined(props.onNext)(selectedPK, dataset, position)}
    />
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


async function imageOrVideoFromFile(
    file: Blob,
    isVideo: boolean
): Promise<ImageOrVideo> {
    if (isVideo) {
        // Get the video's stats
        console.log("Getting video stats")
        const stats = await getVideoStats(file)
        console.log("Video stats:", stats)

        // Create the video object
        return new ImageOrVideo(
            file,
            undefined, // TODO
            [stats.width, stats.height],
            stats.length
        )
    } else {
        // Get the image's stats
        console.log("Getting image stats")
        const stats = await getImageStats(file)
        console.log("Image stats:", stats)

        // Create the image object
        return new ImageOrVideo(
            file,
            undefined, // TODO
            [stats.width, stats.height],
            undefined
        )

    }
}