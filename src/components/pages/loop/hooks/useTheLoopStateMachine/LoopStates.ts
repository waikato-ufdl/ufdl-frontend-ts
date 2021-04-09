import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {BehaviorSubject} from "rxjs";

export type LoopStates = {
    "Selecting Primary Dataset": {
        context: UFDLServerContext
        from: TeamPK | ProjectPK | undefined
    }
    "Selecting Images": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number | undefined
        targetDataset: DatasetPK
    }
    "Training": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<number>
    }
    "Evaluating": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<number>
        evaluationDataset: DatasetPK
        modelOutputPK: number
    }
    "Checking": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
    }
    "Creating Addition Dataset": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        additionDataset: Promise<DatasetPK>
        modelOutputPK: number
    }
    "Prelabel": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
        jobPK: Promise<number>
        progress: BehaviorSubject<number>
    }
    "User Fixing Categories": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
    }
    "Merging Additional Images": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        mergeJobPK: Promise<void>
    }
    "Finished": {
        context: UFDLServerContext
        modelOutputPK: number
    }
    "Error": {
        context: UFDLServerContext
        reason: any
    }
}