import React, {} from "react";
import {list} from "ufdl-js-client/functional/core/project";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";

export type ProjectSelectProps = Omit<ListSelectProps, 'list' | 'labelFunction'>

export function ProjectSelect(props: ProjectSelectProps) {
    return <ListSelect
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
