import CenterContent from "../../CenterContent";
import React from "react";
import {mapFromArray} from "../../../util/map";
import "./AddImagesButton.css";
import {LabelColours} from "./labels/LabelColours";
import {FunctionComponentReturnType} from "../../../util/react/types";
import PickLabelModal from "./labels/PickLabelModal";
import selectFiles from "../../../util/files/selectFiles";
import getPathFromFile from "../../../util/files/getPathFromFile";
import useLocalModal from "../../../util/react/hooks/useLocalModal";

export type AddImagesButtonProps = {
    disabled?: boolean
    onSelected: (files: Map<string, [Blob, string | undefined]>) => void
    labelColours: LabelColours
}


export default function AddImagesButton(
    props: AddImagesButtonProps
): FunctionComponentReturnType {

    const pickLabelModal = useLocalModal();

    return <CenterContent>
        <div className={"AddImagesButton"}>
            <button
                className={"AddFilesButton"}
                onClick={pickLabelModal.onClick}
                disabled={props.disabled}
            >
                Files
            </button>

            <button
                className={"AddFoldersButton"}
                onClick={() => {
                    selectImages(selectFiles("folder"), undefined).then(
                        (images) => {
                            if (images !== undefined) props.onSelected(images);
                        }
                    )
                }}
                disabled={props.disabled}
            >
                Folders
            </button>

            <PickLabelModal
                position={pickLabelModal.position}
                onSubmit={(label) => {
                    pickLabelModal.hide();
                    selectImages(selectFiles("multiple"), label).then(
                        (images) => {
                            if (images !== undefined) props.onSelected(images);
                        }
                    );
                }}
                onCancel={pickLabelModal.hide}
                labelColours={props.labelColours}
                confirmText={"Select files..."}
            />
        </div>
    </CenterContent>
}

async function selectImages(
    filesPromise: Promise<File[] | null>,
    labelOverride: string | undefined
): Promise<Map<string, [Blob, string | undefined]> | undefined> {
    const files = await filesPromise;

    if (files === null || files.length === 0) return;

    return mapFromArray(
        files,
        (file) => {
            const pathElements = getPathFromFile(file);

            const label = pathElements.length > 1 ?
                pathElements[pathElements.length - 2] :
                labelOverride;

            return [file.name, [file, label]];
        }
    );
}