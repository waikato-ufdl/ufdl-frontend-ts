import React, {} from "react";
import {list} from "ufdl-ts-client/functional/core/project";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";
import {ProjectInstance} from "ufdl-ts-client/types/core/project";

export type ProjectSelectProps = Omit<ListSelectProps<ProjectInstance>, 'list' | 'labelFunction'>

export function ProjectSelect(props: ProjectSelectProps) {
    return <ListSelect<ProjectInstance>
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
