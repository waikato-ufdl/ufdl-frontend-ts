import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {DatasetPK} from "../../../../../server/pk";
import {BehaviorSubject} from "rxjs";

export type LoopStates = {
    "Selecting Primary Dataset": {
        context: UFDLServerContext
    }
    "Selecting Images": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number | undefined
        targetDataset: DatasetPK
    }
    "Create Train Job": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
    }
    "Training": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: Promise<number>
        progress: BehaviorSubject<number>
        evaluationDatasetPK: Promise<DatasetPK>
    }
    "Evaluating": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        evaluationDataset: DatasetPK
        modelOutputPK: number
        progress: BehaviorSubject<number>
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
    "Pre-labelling Images": {
        context: UFDLServerContext
        primaryDataset: DatasetPK
        modelOutputPK: number
        additionDataset: DatasetPK
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
    "Finished": undefined
    "Error": {
        context: UFDLServerContext
        reason: any
    }
}