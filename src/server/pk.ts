import {memoInstances} from "../util/memo";
import isDefined from "../util/typescript/isDefined";

export type AnyPK = DatasetPK | ProjectPK | TeamPK | undefined

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

    commonBase(pk: AnyPK): AnyPK {
        if (getTeamPK(pk) === this)
            return this
        else
            return undefined
    }

    toJSON() {
        return {
            type: "TeamPK",
            asNumber: this.asNumber
        }
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

    commonBase(pk: AnyPK): AnyPK {
        if (getProjectPK(pk) === this)
            return this
        else
            return this.team.commonBase(pk)
    }

    toJSON() {
        return {
            type: "ProjectPK",
            asNumber: this.asNumber,
            team: this.team.toJSON()
        }
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

    commonBase(pk: AnyPK): AnyPK {
        if (getDatasetPK(pk) === this)
            return this
        else
            return this.project.commonBase(pk)
    }

    toJSON() {
        return {
            type: "DatasetPK",
            asNumber: this.asNumber,
            project: this.project.toJSON()
        }
    }
}

export function fromJSON(
    json: any
): AnyPK {
    if (json === undefined) return undefined
    switch (json.type) {
        case "DatasetPK":
            return new DatasetPK(json['project'] as ProjectPK, json['asNumber']);
        case "ProjectPK":
            return new ProjectPK(json['team'] as TeamPK, json['asNumber']);
        case "TeamPK":
            return new TeamPK(json['asNumber']);
    }
    return undefined
}

export function getCommonBasePK(
    a: AnyPK,
    b: AnyPK
): AnyPK {
    if (isDefined(a))
        return a.commonBase(b)
    else
        return undefined
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

