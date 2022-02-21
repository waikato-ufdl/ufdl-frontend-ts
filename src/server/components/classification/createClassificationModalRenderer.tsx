import {ClassColours} from "../../util/classification";
import {addFilesRenderer, FileAnnotationModalRenderer} from "../AddFilesButton";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import getPathFromFile from "../../../util/files/getPathFromFile";
import PickClassForm from "./PickClassForm";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import React from "react";

export default function createClassificationModalRenderer(
    colours: [ClassColours]
): FileAnnotationModalRenderer<Classification> {
    return (onSubmit, onCancel) => {
        return <PickClassForm
            onSubmit={(classification) => addFilesRenderer("multiple", () => classification)(onSubmit, onCancel)}
            colours={colours[0]}
            confirmText={"Select files..."}
        />
    }
}