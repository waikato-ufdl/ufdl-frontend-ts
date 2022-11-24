import {FunctionComponentReturnType} from "../../../util/react/types";
import ImageClassificationAnnotatorPage from "../annotation/icap/ImageClassificationAnnotatorPage";
import ObjectDetectionAnnotatorPage from "../annotation/odap/ObjectDetectionAnnotatorPage";
import React, {Dispatch} from "react";
import {DomainName} from "../../../server/domains";
import {DatasetPK} from "../../../server/pk";
import {ClassColours} from "../../../server/util/classification";
import UFDLServerContext from "../../../../../ufdl-ts-client/dist/UFDLServerContext";
import {JobTemplateInstance} from "../../../../../ufdl-ts-client/dist/types/core/jobs/job_template";
import SpeechAnnotatorPage from "../annotation/spap/SpeechAnnotatorPage";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";
import {Controllable} from "../../../util/react/hooks/useControllableState";
import {AnnotatorTopMenuExtraControlsComponent} from "../../../server/components/AnnotatorTopMenu";
import getContractTemplates from "./jobs/getContractTemplates";

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
    onError: (reason: any) => void
    queryDependencies?: {
        dataset?: readonly unknown[]
        fileData?: readonly unknown[]
        annotations?: readonly unknown[]
        onlyFetched?: boolean
    }
    evalQueryDependencies?: {
        dataset?: readonly unknown[]
        fileData?: readonly unknown[]
        annotations?: readonly unknown[]
        onlyFetched?: boolean
    }
    mode?: typeof DEFAULT | "Single" | "Multi"
    selectedSortOrder: Controllable<WithDefault<string>>
    sortOrderLocked?: boolean
    heading?: string
    ExtraControls?: AnnotatorTopMenuExtraControlsComponent
}

export default function LoopAnnotatorPage(
    props: LoopAnnotatorPageProps
): FunctionComponentReturnType {

    function updateMatchingTemplates() {
        const contract = props.contract
        if (contract === undefined) return

        getContractTemplates(
            props.context,
            props.domain,
            contract,
            props.modelType
        ).then(
            props.setSelectableTemplates
        ).catch(
            props.onError
        )
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
                mode={props.mode}
                selectedSortOrder={props.selectedSortOrder}
                sortOrderLocked={props.sortOrderLocked}
                heading={props.heading}
                ExtraControls={props.ExtraControls}
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
                selectedSortOrder={props.selectedSortOrder}
                sortOrderLocked={props.sortOrderLocked}
                heading={props.heading}
                ExtraControls={props.ExtraControls}
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
                selectedSortOrder={props.selectedSortOrder}
                sortOrderLocked={props.sortOrderLocked}
                heading={props.heading}
                ExtraControls={props.ExtraControls}
            />
        default:
            props.onError(`No annotator page for domain ${props.domain}`)
            return null;
    }
}
