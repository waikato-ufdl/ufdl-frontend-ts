import CenterContent from "../../CenterContent";
import React from "react";
import {mapFromArray} from "../../../util/map";
import "./AddImagesButton.css";
import {FunctionComponentReturnType} from "../../../util/react/types";
import selectFiles from "../../../util/files/selectFiles";
import getPathFromFile from "../../../util/files/getPathFromFile";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {Classification, NO_CLASSIFICATION} from "../../../server/types/annotations";
import {ClassColours} from "../../../server/util/classification";
import PickClassModal from "../../../server/components/classification/PickClassModal";

export type AddImagesButtonProps = {
    disabled?: boolean
    onSelected: (files: ReadonlyMap<string, [Blob, Classification]>) => void
    colours: ClassColours
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
                    selectImages(
                        selectFiles("folder"), NO_CLASSIFICATION).then(
                        (images) => {
                            if (images !== undefined) props.onSelected(images);
                        }
                    )
                }}
                disabled={props.disabled}
            >
                Folders
            </button>

            <PickClassModal
                position={pickLabelModal.position}
                onSubmit={(classification) => {
                    pickLabelModal.hide();
                    selectImages(selectFiles("multiple"), classification).then(
                        (images) => {
                            if (images !== undefined) props.onSelected(images);
                        }
                    );
                }}
                onCancel={pickLabelModal.hide}
                colours={props.colours}
                confirmText={"Select files..."}
            />
        </div>
    </CenterContent>
}

async function selectImages(
    filesPromise: Promise<File[] | null>,
    labelOverride: Classification
): Promise<Map<string, [Blob, Classification]> | undefined> {
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