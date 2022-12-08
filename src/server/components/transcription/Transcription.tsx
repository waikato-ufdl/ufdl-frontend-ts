import {Transcription} from "../../types/annotations/Transcription";
import {Absent} from "../../../util/typescript/types/Possible";
import {DatasetDispatchItemAnnotationType} from "../../hooks/useDataset/types";
import hasData from "../../../util/react/query/hasData";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import React from "react";
import MinimumEditDistance from "./MinimumEditDistance";
import {AnnotationComponent} from "../dataset/types";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {OptionalAnnotations} from "../../types/annotations/OptionalAnnotations";

export default function createTranscriptionComponent(
    onTranscriptionChanged?: (filename: string, newTranscription: OptionalAnnotations<Transcription>) => void
): AnnotationComponent<DatasetDispatchItemAnnotationType<Transcription>> {
    return (
        {
            filename,
            annotation,
            comparisonAnnotation,
            disabled
        }
    ) => {

        const [editing, setEditing] = useStateSafe<string | undefined>(constantInitialiser(undefined))

        if (!hasData(annotation)) return <span className={"Transcription"}>...</span>

        if (editing === undefined || onTranscriptionChanged === undefined) {

            const transcriptionString = annotation.data === NO_ANNOTATION
                ? ""
                : annotation.data

            const onClick = disabled
                ? undefined
                : () => setEditing(transcriptionString)

            if (comparisonAnnotation !== Absent && hasData(comparisonAnnotation)) {
                const comparisonTranscriptionString = comparisonAnnotation.data === NO_ANNOTATION ?
                    ""
                    : comparisonAnnotation.data
                return <MinimumEditDistance
                    className={"Transcription"}
                    targetString={comparisonTranscriptionString}
                    startingString={transcriptionString}
                    onClick={onClick}
                />
            }

            return <span
                className={"Transcription"}
                onClick={onClick}
            >
                {transcriptionString}
            </span>
        }

        return <textarea
            className={"Transcription"}
            placeholder={"Transcription..."}
            onChange={event => setEditing(event.target.value)}
            onKeyDown={
                event => {
                    if (event.shiftKey && event.key === "Enter") {
                        onTranscriptionChanged!(filename, editing === "" ? NO_ANNOTATION : editing)
                        setEditing(undefined)
                        event.preventDefault()
                    }
                }
            }
        >
            {editing}
        </textarea>
    }
}
