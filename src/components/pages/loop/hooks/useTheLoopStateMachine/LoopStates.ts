import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {BehaviorSubject} from "rxjs";
import {DomainName} from "../../../../../server/domains";
import {ParameterValue} from "../../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {ValidStates} from "../../../../../util/react/hooks/useStateMachine/types";

export type LoopStates = ValidStates<{
    "Initial": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
    }
    "Selecting Primary Dataset": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        from: TeamPK | ProjectPK | undefined
    }
    "Selecting Initial Images": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        targetDataset: DatasetPK
        domain: DomainName
        trainTemplatePK: number | undefined
        trainParameters: { [name: string]: ParameterValue } | undefined
        evalTemplatePK: number | undefined
        evalParameters: { [name: string]: ParameterValue } | undefined
    }
    "Selecting Prelabel Images": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
        targetDataset: DatasetPK
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Creating Train Job": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<[number, string | undefined]>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Training": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        jobPK: number
        progress: BehaviorSubject<[number, string | undefined]>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Creating Evaluate Job": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<[number, string | undefined]>
        evaluationDataset: DatasetPK
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Evaluating": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        jobPK: number
        progress: BehaviorSubject<[number, string | undefined]>
        evaluationDataset: DatasetPK
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Checking": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Creating Addition Dataset": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        additionDataset: Promise<DatasetPK>
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Creating Prelabel Job": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<[number, string | undefined]>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "Prelabel": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        jobPK: number
        progress: BehaviorSubject<[number, string | undefined]>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
    }
    "User Fixing Categories": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
        timingInfo: {
            [timestamp: number]: {
                filename: string
                oldLabel: string | null | undefined
                newLabel: string | null
            }
        }
    }
    "Merging Additional Images": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        primaryDataset: DatasetPK
        modelOutputPK: number
        mergeJobPK: Promise<void>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
        iteration: number
        timingInfo: {
            [timestamp: number]: {
                filename: string
                oldLabel: string | null | undefined
                newLabel: string | null
            }
        }
    }
    "Finished": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        modelOutputPK: number
    }
    "Error": {
        context: UFDLServerContext
        prelabelMode: "None" | "Single" | "Multi" | "Default"
        reason: any
    }
}>
