import React from "react";
import {WithDefault} from "../../../../util/typescript/default";
import {Image} from "../../../../server/types/data";
import {Classification} from "../../../../server/types/annotations";
import {Dataset} from "../../../../server/types/Dataset";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {ClassColours} from "../../../../server/util/classification";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {CompareFunction} from "../../../../util/typescript/sort/CompareFunction";
import DatasetOverview from "../../../../server/components/DatasetOverview";
import {ImageRenderer} from "../../../../server/components/image/ImageRenderer";
import createClassificationRenderer from "../../../../server/components/classification/createClassificationRenderer";
import "./ICDatasetItem.css";
import createClassificationModalRenderer
    from "../../../../server/components/classification/createClassificationModalRenderer";

export type ICDatasetOverviewProps = {
    dataset: Dataset<Image, Classification> | undefined
    evalDataset: Dataset<Image, Classification> | undefined
    onFileSelected: (item: DatasetItem<Image, Classification>) => void
    onReclassify: (filename: string, oldLabel: Classification, newLabel: Classification) => void
    onFileClicked: (item: DatasetItem<Image, Classification>) => void
    onAddFiles: (files: ReadonlyMap<string, [Blob, Classification]>) => void
    colours: ClassColours
    sortFunction: WithDefault<CompareFunction<DatasetItem<Image, Classification>> | undefined>
}

export default function ICDatasetOverview(
    props: ICDatasetOverviewProps
) {
    const modalGenerator = useDerivedState(
        createClassificationModalRenderer,
        [props.colours]
    )

    const classificationRenderer = useDerivedState(
        () => createClassificationRenderer(props.colours, props.onReclassify),
        [props.colours, props.onReclassify]
    )

    return <DatasetOverview<Image, Classification>
        className={"ICDatasetOverview"}
        dataset={props.dataset}
        evalDataset={props.evalDataset}
        renderData={ImageRenderer}
        renderAnnotation={classificationRenderer}
        onItemSelected={props.onFileSelected}
        onItemClicked={props.onFileClicked}
        onAddFiles={props.onAddFiles}
        sortFunction={props.sortFunction}
        itemClass={"ICDatasetItem"}
        annotationModal={modalGenerator}
    />
}