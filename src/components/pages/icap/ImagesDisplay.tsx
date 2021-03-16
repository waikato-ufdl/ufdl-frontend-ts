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

export type ImagesDisplayProps = {
    dataset: ImageClassificationDataset | undefined
    onFileSelected: (filename: string) => void
    onLabelChanged: (filename: string, oldLabel: string | undefined, newLabel: string | undefined) => void
    onFileClicked: (filename: string, file: ImageClassificationDatasetItem) => void
    onAddFiles: (files: ReadonlyMap<string, ImageClassificationDatasetItem>) => void
    labelColours: LabelColours
}

export default function ImagesDisplay(props: ImagesDisplayProps) {

    const itemStyle: FlexItemProps["style"] = {
        margin: "1.25%",
        border: 0,
        padding: 0,
        height: "16.3125%",
        overflow: "hidden",
        flexGrow: 0,
        width: "22.5%"
    };

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
        {
            props.dataset !== undefined && mapToArray(
                props.dataset,
                (filename, file) => {
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
            )
        }
    </FlexContainer>

}