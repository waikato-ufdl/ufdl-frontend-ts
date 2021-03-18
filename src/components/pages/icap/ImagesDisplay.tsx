import React from "react";
import AddImagesButton from "./AddImagesButton";
import {mapToArray} from "../../../util/map";
import {ICDatasetItem} from "./ICDatasetItem";
import {LabelColours} from "./labels/LabelColours";
import {
    ImageClassificationDataset,
    ImageClassificationDatasetItem
} from "../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";
import FlexContainer from "../../../util/react/component/flex/FlexContainer";
import {FlexItemProps} from "../../../util/react/component/flex/FlexItem";
import {argsAsArray} from "../../../util/typescript/functions/argsAsArray";
import {handleDefaults, PropsDefaultHandlers, WithDefault} from "../../../util/typescript/default";
import {SortFunction} from "./sorting";

export type ImagesDisplayProps = {
    dataset: ImageClassificationDataset | undefined
    onFileSelected: (filename: string) => void
    onLabelChanged: (filename: string, oldLabel: string | undefined, newLabel: string | undefined) => void
    onFileClicked: (filename: string, file: ImageClassificationDatasetItem) => void
    onAddFiles: (files: ReadonlyMap<string, ImageClassificationDatasetItem>) => void
    labelColours: LabelColours
    sortFunction: WithDefault<SortFunction>
}

const IMAGES_DISPLAY_DEFAULT_HANDLERS: PropsDefaultHandlers<ImagesDisplayProps> = {
    sortFunction: () => (a, b) => a[0].localeCompare(b[0])
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
    const items: [string, ImageClassificationDatasetItem][]
        = props.dataset === undefined ? [] : mapToArray(props.dataset, argsAsArray);

    // Sort them according to the given sort function
    items.sort(defaultHandledProps.sortFunction);

    // Create a display item for each dataset item
    const icDatasetItems = items.map(
        ([filename, file]) => {
            return <ICDatasetItem
                key={filename}
                filename={filename}
                imageData={file.data}
                label={file.annotations}
                onRelabelled={(oldLabel, newLabel) => props.onLabelChanged(filename, oldLabel, newLabel)}
                selected={file.selected}
                onSelect={() => props.onFileSelected(filename)}
                onImageClick={() => props.onFileClicked(filename, file)}
                labelColours={props.labelColours}
            />
        }
    );

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
        <AddImagesButton
            disabled={props.dataset === undefined}
            onSelected={props.onAddFiles}
            labelColours={props.labelColours}
        />
        {icDatasetItems}
    </FlexContainer>

}