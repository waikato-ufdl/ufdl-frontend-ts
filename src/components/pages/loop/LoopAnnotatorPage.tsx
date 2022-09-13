import {FunctionComponentReturnType} from "../../../util/react/types";
import ImageClassificationAnnotatorPage from "../annotation/icap/ImageClassificationAnnotatorPage";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template";
import ObjectDetectionAnnotatorPage from "../annotation/odap/ObjectDetectionAnnotatorPage";
import React, {Dispatch} from "react";
import {DomainName} from "../../../server/domains";
import {DatasetPK} from "../../../server/pk";
import {ClassColours} from "../../../server/util/classification";
import UFDLServerContext from "../../../../../ufdl-ts-client/dist/UFDLServerContext";
import {JobTemplateInstance} from "../../../../../ufdl-ts-client/dist/types/core/jobs/job_template";

export type LoopAnnotatorPageProps = {
    domain: DomainName
    targetDataset: DatasetPK
    evalDatasetPK: DatasetPK | undefined
    nextLabel: string
    contract: "Train" | "Predict" | undefined
    classColours: ClassColours | undefined
    setClassColours: Dispatch<ClassColours>
    context: UFDLServerContext
    setSelectableTemplates: Dispatch<JobTemplateInstance[]>
    onNext: (x: number, y: number) => void
    onBack: () => void
    onError: (reason: any) => void
}

export default function LoopAnnotatorPage(
    props: LoopAnnotatorPageProps
): FunctionComponentReturnType {
    const datasetPKType = `PK<Dataset<Domain<'${props.domain}'>>>`

    switch (props.domain) {
        case "Image Classification":
            return <ImageClassificationAnnotatorPage
                lockedPK={props.targetDataset}
                evalPK={props.evalDatasetPK}
                initialColours={props.classColours}
                nextLabel={props.nextLabel}
                onNext={(_, __, labelColours, position) => {
                    props.setClassColours(labelColours);
                    if (props.contract !== undefined)
                        job_template.get_all_matching_templates(
                            props.context,
                            props.contract,
                            {dataset: datasetPKType}
                        ).then(
                            props.setSelectableTemplates
                        ).catch(props.onError)
                    props.onNext(...position);
                }}
                onBack={props.onBack}
            />
        case "Object Detection":
            // TODO: Add eval dataset capability
            return <ObjectDetectionAnnotatorPage
                lockedPK={props.targetDataset}
                nextLabel={props.nextLabel}
                onNext={(_, __, position) => {
                    if (props.contract !== undefined)
                        job_template.get_all_matching_templates(
                            props.context,
                            props.contract,
                            {dataset: datasetPKType}
                        ).then(
                            props.setSelectableTemplates
                        ).catch(props.onError)
                    props.onNext(...position);
                }}
                onBack={props.onBack}
            />
        default:
            props.onError(`No annotator page for domain ${props.domain}`)
            return null;
    }
}
