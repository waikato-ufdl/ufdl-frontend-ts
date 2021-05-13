import {ClassColours} from "../../util/classification";
import {FileAnnotationModalRenderer} from "../AddFilesButton";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import getPathFromFile from "../../../util/files/getPathFromFile";
import PickClassForm from "./PickClassForm";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import React from "react";

export default function createClassificationModalRenderer(
    colours: [ClassColours]
): FileAnnotationModalRenderer<Classification> {
    return (method, onSubmit) => {
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
            colours={colours[0]}
            confirmText={"Select files..."}
        />
    }
}