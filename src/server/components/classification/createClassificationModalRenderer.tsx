import {ClassColours} from "../../util/classification";
import {addFilesRenderer, FileAnnotationModalRenderer} from "../AddFilesButton";
import {Classification} from "../../types/annotations";
import PickClassForm from "./PickClassForm";
import React from "react";
import {Data} from "../../types/data";

export default function createClassificationModalRenderer<D extends Data>(
    colours: ClassColours,
    getData: (file: File) => D
): FileAnnotationModalRenderer<D, Classification> {
    return (onSubmit) => {
        return () => <PickClassForm
            onSubmit={
                (classification) => {
                    addFilesRenderer("multiple", getData, () => classification)(onSubmit)
                }
            }
            colours={colours}
            confirmText={"Select files..."}
        />
    }
}