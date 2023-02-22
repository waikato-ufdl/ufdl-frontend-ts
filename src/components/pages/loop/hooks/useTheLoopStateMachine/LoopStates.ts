import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {BehaviorSubject} from "rxjs";
import {DomainName} from "../../../../../server/domains";
import {ParameterValue} from "../../../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import {ValidStates} from "../../../../../util/react/hooks/useStateMachine/types";
import {PrelabelMode, Questionnaire} from "../../../../../EXPERIMENT";
import {RecursivePartial} from "../../../../../util/typescript/types/RecursivePartial";

export type LoopStates = ValidStates<{
    "Initial": {
        context: UFDLServerContext,
        agreed: boolean
    }
    "Agreement Page": {
        context: UFDLServerContext
    }
    "Selecting Primary Dataset": {
        context: UFDLServerContext
        participantNumber: number
        from: TeamPK | ProjectPK | undefined
    }
    "Selecting Initial Images": {
        context: UFDLServerContext
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        participantNumber: number
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
        },
        questionnaire?: Questionnaire
    }
    "Questionnaire": {
        context: UFDLServerContext
        participantNumber: number
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
        },
        questionnaire: RecursivePartial<Questionnaire>
    }
    "Finished": {
        context: UFDLServerContext
        participantNumber: number
        modelOutputPK: number
    }
    "Error": {
        context: UFDLServerContext
        participantNumber: number
        reason: any
    }
}>
