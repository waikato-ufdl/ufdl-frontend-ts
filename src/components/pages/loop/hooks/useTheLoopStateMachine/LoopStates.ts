import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {BehaviorSubject} from "rxjs";
import {DomainName} from "../../../../../server/domains";
import {ParameterValue} from "../../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {ValidStates} from "../../../../../util/react/hooks/useStateMachine/types";

export type LoopStates = ValidStates<{
    "Initial": {
        context: UFDLServerContext
    }
    "Selecting Primary Dataset": {
        context: UFDLServerContext
        from: TeamPK | ProjectPK | undefined
    }
    "Selecting Initial Images": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        targetDataset: DatasetPK
        domain: DomainName
    }
    "Selecting Prelabel Images": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
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
        primaryDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<number>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Training": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        jobPK: number
        progress: BehaviorSubject<number>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Creating Evaluate Job": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<number>
        evaluationDataset: DatasetPK
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Evaluating": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        jobPK: number
        progress: BehaviorSubject<number>
        evaluationDataset: DatasetPK
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Checking": {
        context: UFDLServerContext
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
    }
    "Creating Addition Dataset": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        additionDataset: Promise<DatasetPK>
        modelOutputPK: number
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Creating Prelabel Job": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<number>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Prelabel": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        jobPK: number
        progress: BehaviorSubject<number>
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "User Fixing Categories": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        domain: DomainName
        framework: [string, string]
        modelType: string
        trainTemplatePK: number
        trainParameters: { [name: string]: ParameterValue }
        evalTemplatePK: number
        evalParameters: { [name: string]: ParameterValue }
    }
    "Merging Additional Images": {
        context: UFDLServerContext
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
    }
    "Finished": {
        context: UFDLServerContext
        modelOutputPK: number
    }
    "Error": {
        context: UFDLServerContext
        reason: any
    }
}>
