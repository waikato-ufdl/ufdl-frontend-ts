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
import SpeechAnnotatorPage from "../annotation/spap/SpeechAnnotatorPage";

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
    modelType: string | undefined
    onNext: (x: number, y: number) => void
    onBack: () => void
    onError: (reason: any) => void,
    queryDependencies?: readonly unknown[],
    evalQueryDependencies?: readonly unknown[]
}

export default function LoopAnnotatorPage(
    props: LoopAnnotatorPageProps
): FunctionComponentReturnType {
    const datasetPKType = `PK<Dataset<Domain<'${props.domain}'>>>`

    function updateMatchingTemplates() {
        if (props.contract !== undefined) {
            const types: {[p: string]: string} = {dataset: datasetPKType}

            if (props.modelType !== undefined)
                types['model'] = `JobOutput<${props.modelType}>`

            job_template.get_all_matching_templates(
                props.context,
                props.contract,
                types
            ).then(
                props.setSelectableTemplates
            ).catch(props.onError)
        }
    }

    switch (props.domain) {
        case "Image Classification":
            return <ImageClassificationAnnotatorPage
                lockedPK={props.targetDataset}
                evalPK={props.evalDatasetPK}
                initialColours={props.classColours}
                nextLabel={props.nextLabel}
                onNext={(_, __, labelColours, position) => {
                    props.setClassColours(labelColours);
                    updateMatchingTemplates()
                    props.onNext(...position);
                }}
                onBack={props.onBack}
                queryDependencies={props.queryDependencies}
                evalQueryDependencies={props.evalQueryDependencies}
            />
        case "Object Detection":
            // TODO: Add eval dataset capability
            return <ObjectDetectionAnnotatorPage
                lockedPK={props.targetDataset}
                nextLabel={props.nextLabel}
                onNext={(_, __, position) => {
                    updateMatchingTemplates()
                    props.onNext(...position);
                }}
                onBack={props.onBack}
                queryDependencies={props.queryDependencies}
                evalQueryDependencies={props.evalQueryDependencies}
            />
        case "Speech":
            return <SpeechAnnotatorPage
                lockedPK={props.targetDataset}
                evalPK={props.evalDatasetPK}
                nextLabel={props.nextLabel}
                onNext={(_, __, position) => {
                    updateMatchingTemplates()
                    props.onNext(...position);
                }}
                onBack={props.onBack}
                queryDependencies={props.queryDependencies}
                evalQueryDependencies={props.evalQueryDependencies}
            />
        default:
            props.onError(`No annotator page for domain ${props.domain}`)
            return null;
    }
}
