import React from "react";
import {mapToArray} from "../../../../util/map";
import ICDatasetItem from "./ICDatasetItem";
import FlexContainer from "../../../../util/react/component/flex/FlexContainer";
import {FlexItemProps} from "../../../../util/react/component/flex/FlexItem";
import {handleDefaults, PropsDefaultHandlers, WithDefault} from "../../../../util/typescript/default";
import {SORT_FUNCTIONS, SortFunction} from "./sorting";
import {Image} from "../../../../server/types/data";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {Dataset} from "../../../../server/types/Dataset";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {undefinedAsAbsent} from "../../../../util/typescript/types/Possible";
import {ClassColours} from "../../../../server/util/classification";
import AddFilesButton, {AnnotationModalContentGenerator} from "../../../../server/components/AddFilesButton";
import PickClassForm from "../../../../server/components/classification/PickClassForm";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import getPathFromFile from "../../../../util/files/getPathFromFile";

export type ImagesDisplayProps = {
    dataset: Dataset<Image, Classification> | undefined
    evalDataset: Dataset<Image, Classification> | undefined
    onFileSelected: (filename: string) => void
    onReclassify: (filename: string, oldLabel: Classification, newLabel: Classification) => void
    onFileClicked: (filename: string, file: DatasetItem<Image, Classification>) => void
    onAddFiles: (files: ReadonlyMap<string, [Blob, Classification]>) => void
    colours: ClassColours
    sortFunction: WithDefault<SortFunction>
}

const IMAGES_DISPLAY_DEFAULT_HANDLERS: PropsDefaultHandlers<ImagesDisplayProps> = {
    sortFunction: () => SORT_FUNCTIONS.filename
};

export default function ImagesDisplay(
    props: ImagesDisplayProps
) {
    const defaultHandledProps = handleDefaults(props, IMAGES_DISPLAY_DEFAULT_HANDLERS);

    const itemStyle: FlexItemProps["style"] = {
        margin: "1.25%",
        border: 0,
        padding: 0,
        height: "16.3125%",
        overflow: "hidden",
        flexGrow: 0,
        width: "22.5%"
    };

    // Extract the dataset items, if any
    const items: DatasetItem<Image, Classification>[]
        = props.dataset === undefined
            ? []
            : mapToArray(props.dataset, (_filename, item) => item);

    // Sort them according to the given sort function
    items.sort(defaultHandledProps.sortFunction);

    // Create a display item for each dataset item
    const icDatasetItems = items.map(
        (item) => {
            return <ICDatasetItem
                key={item.filename}
                item={item}
                evalClass={undefinedAsAbsent(props.evalDataset?.get(item.filename)?.annotations)}
                onReclassify={(oldLabel, newLabel) => props.onReclassify(item.filename, oldLabel, newLabel)}
                onSelect={() => props.onFileSelected(item.filename)}
                onImageClick={() => props.onFileClicked(item.filename, item)}
                colours={props.colours}
            />
        }
    );

    const modalGenerator: AnnotationModalContentGenerator<Classification> = (method, onSubmit) => {
        if (method === "folder") {
            return (file) => {
                const pathElements = getPathFromFile(file);

                return pathElements.length > 1 ?
                    pathElements[pathElements.length - 2] :
                    NO_CLASSIFICATION;
            };
        }

        return <PickClassForm
            onSubmit={(classification) => onSubmit(constantInitialiser(classification))}
            colours={props.colours}
            confirmText={"Select files..."}
        />
    }

    return <FlexContainer
        id={"images"}
        itemProps={() => {return {style: itemStyle};}}
        style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "initial",
            alignContent: "flex-start"
        }}
    >
        <AddFilesButton<Classification>
            disabled={props.dataset === undefined}
            onSelected={props.onAddFiles}
            annotationModal={modalGenerator}
        />
        {icDatasetItems}
    </FlexContainer>

}