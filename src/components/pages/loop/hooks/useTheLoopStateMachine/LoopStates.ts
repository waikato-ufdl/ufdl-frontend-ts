import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {BehaviorSubject} from "rxjs";
import {DomainName} from "../../../../../server/domains";
import {ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {GoodState} from "./error/goodStates/GoodState";
import {LoopStateAndData} from "./types/LoopStateAndData";

export type LoopStates = {
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
        trainTemplatePK: number | undefined
        trainParameters: { [name: string]: ParameterValue } | undefined
        evalTemplatePK: number | undefined
        evalParameters: { [name: string]: ParameterValue } | undefined
    }
    "Creating Train Job": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"Selecting Initial Images" | "User Fixing Categories">
    }
    "Training": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"Selecting Initial Images" | "User Fixing Categories">
    }
    "Creating Evaluate Job": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"Selecting Initial Images" | "User Fixing Categories" | "Checking">
    }
    "Evaluating": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"Selecting Initial Images" | "User Fixing Categories" | "Checking">
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
        lastGoodState: LoopStateAndData<"Checking">
    }
    "Selecting Prelabel Images": {
        context: UFDLServerContext
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
    "Creating Prelabel Job": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"Selecting Prelabel Images">
    }
    "Prelabel": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"Selecting Prelabel Images">
    }
    "User Fixing Categories": {
        context: UFDLServerContext
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
        lastGoodState: LoopStateAndData<"User Fixing Categories">
    }
    "Finished": {
        context: UFDLServerContext
        modelOutputPK: number
    }
    "Error": {
        context: UFDLServerContext
        reason: any,
        lastGoodState?: LoopStateAndData<GoodState>
    }
}
