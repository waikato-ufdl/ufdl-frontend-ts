import React, {} from "react";
import {list} from "ufdl-ts-client/functional/core/project";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {ProjectInstance} from "ufdl-ts-client/types/core/project";
import {nameFromJSON} from "../util/nameFromJSON";

export type ProjectSelectProps = Omit<ListSelectProps<ProjectInstance>, 'list' | 'labelFunction'>

export function ProjectSelect(props: ProjectSelectProps) {
    return <ListSelect<ProjectInstance>
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
