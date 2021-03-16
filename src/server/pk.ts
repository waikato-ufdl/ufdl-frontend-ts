import {memoInstances} from "../util/memo";

@memoInstances
export class TeamPK {
    constructor(
        public readonly asNumber: number
    ) {}

    project(pk: undefined): undefined;
    project(pk: number): ProjectPK;
    project(pk: number | undefined): ProjectPK | undefined;
    project(pk: number | undefined): ProjectPK | undefined {
        return pk === undefined ? undefined : new ProjectPK(this, pk);
    }

    owns(pk: ProjectPK | DatasetPK): boolean {
        return pk.team === this;
    }
}

@memoInstances
export class ProjectPK {
    constructor(
        public readonly team: TeamPK,
        public readonly asNumber: number
    ) {}

    dataset(pk: undefined): undefined;
    dataset(pk: number): DatasetPK;
    dataset(pk: number | undefined): DatasetPK | undefined;
    dataset(pk: number | undefined): DatasetPK | undefined {
        return pk === undefined ? undefined : new DatasetPK(this, pk);
    }

    owns(pk: DatasetPK): boolean {
        return pk.project === this;
    }
}

@memoInstances
export class DatasetPK {
    constructor(
        public readonly project: ProjectPK,
        public readonly asNumber: number
    ) {}

    get team(): TeamPK {
        return this.project.team;
    }
}

export function getTeamPK(
    value?: TeamPK | ProjectPK | DatasetPK
): TeamPK | undefined {
    if (value === undefined)
        return undefined;
    else if (value instanceof TeamPK)
        return value;
    else
        return value.team;
}


export function getProjectPK(
    value?: TeamPK | ProjectPK | DatasetPK
): ProjectPK | undefined {
    if (value === undefined || value instanceof TeamPK)
        return undefined;
    else if (value instanceof ProjectPK)
        return value;
    else
        return value.project;
}


export function getDatasetPK(
    value?: TeamPK | ProjectPK | DatasetPK
): DatasetPK | undefined {
    if (value instanceof DatasetPK)
        return value;
    else
        return undefined;
}

