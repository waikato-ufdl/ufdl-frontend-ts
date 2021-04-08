import CenterContent from "../../CenterContent";
import React from "react";
import {getPathFromFile, selectFiles, selectFolders} from "../../../util/files";
import {mapFromArray} from "../../../util/map";
import {fromFile} from "../../../image/fromFile";
import {
    ImageClassificationDataset,
    ImageClassificationDatasetItem
} from "../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";
import "./AddImagesButton.css";
import {LabelColours} from "./labels/LabelColours";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {FunctionComponentReturnType} from "../../../util/react/types";
import PickLabelModal from "./labels/PickLabelModal";

export type AddImagesButtonProps = {
    disabled?: boolean
    onSelected: (files: ImageClassificationDataset) => void
    labelColours: LabelColours
}


export default function AddImagesButton(
    props: AddImagesButtonProps
): FunctionComponentReturnType {

    const [modal, setModal] = useStateSafe<[number, number] | undefined>(constantInitialiser(undefined));

    return <CenterContent>
        <div className={"AddImagesButton"}>
            <button
                className={"AddFilesButton"}
                onClick={(event) => setModal([event.clientX, event.clientY])}
                disabled={props.disabled}
            >
                Files
            </button>

            <button
                className={"AddFoldersButton"}
                onClick={() => selectImages(selectFolders(), undefined, props.onSelected)}
                disabled={props.disabled}
            >
                Folders
            </button>

            <PickLabelModal
                position={modal}
                onSubmit={(label) => {
                    setModal(undefined);
                    selectImages(selectFiles(true), label, props.onSelected);
                }}
                onCancel={() => setModal(undefined)}
                labelColours={props.labelColours}
                confirmText={"Select files..."}
            />
        </div>
    </CenterContent>
}

function selectImages(
    files: Promise<File[] | null>,
    labelOverride: string | undefined,
    then: (images: ImageClassificationDataset) => void
) {
    files.then(
        (files) => {
            if (files === null || files.length === 0) return;

            const images: ImageClassificationDataset = mapFromArray(
                files,
                (file) => {
                    const pathElements = getPathFromFile(file);

                    const label = pathElements.length > 1 ?
                        pathElements[pathElements.length - 2] :
                        labelOverride;

                    const fileInfo: ImageClassificationDatasetItem = {
                        data: fromFile(file),
                        resident: false,
                        selected: false,
                        annotations: label
                    };

                    return [file.name, fileInfo]
                }
            );

            then(images);
        }
    )
}