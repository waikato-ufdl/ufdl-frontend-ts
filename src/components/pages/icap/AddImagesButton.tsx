import CenterContent from "../../CenterContent";
import React from "react";
import {getPathFromFile, selectFiles, selectFolders} from "../../../util/files";
import {mapFromArray} from "../../../util/map";
import {fromFile} from "../../../image/fromFile";
import "./AddImagesButton.css";
import {LabelColours} from "./labels/LabelColours";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {FunctionComponentReturnType} from "../../../util/react/types";
import PickLabelModal from "./labels/PickLabelModal";
import {BehaviorSubject} from "rxjs";

export type AddImagesButtonProps = {
    disabled?: boolean
    onSelected: (files: Map<string, [BehaviorSubject<Blob>, string | undefined]>) => void
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
                onClick={() => {
                    selectImages(selectFolders(), undefined).then(
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
                position={modal}
                onSubmit={(label) => {
                    setModal(undefined);
                    selectImages(selectFiles(true), label).then(
                        (images) => {
                            if (images !== undefined) props.onSelected(images);
                        }
                    );
                }}
                onCancel={() => setModal(undefined)}
                labelColours={props.labelColours}
                confirmText={"Select files..."}
            />
        </div>
    </CenterContent>
}

async function selectImages(
    filesPromise: Promise<File[] | null>,
    labelOverride: string | undefined
): Promise<Map<string, [BehaviorSubject<Blob>, string | undefined]> | undefined> {
    const files = await filesPromise;

    if (files === null || files.length === 0) return;

    return mapFromArray(
        files,
        (file) => {
            const pathElements = getPathFromFile(file);

            const label = pathElements.length > 1 ?
                pathElements[pathElements.length - 2] :
                labelOverride;

            return [file.name, [fromFile(file), label]];
        }
    );
}