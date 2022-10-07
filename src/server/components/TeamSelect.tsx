import React from "react";
import {list} from "ufdl-ts-client/functional/core/team";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {TeamInstance} from "ufdl-ts-client/types/core/team";
import {nameFromJSON} from "../util/nameFromJSON";

export type TeamSelectProps = Omit<ListSelectProps<TeamInstance>, 'list' | 'labelFunction'>

export function TeamSelect(props: TeamSelectProps) {
    return <ListSelect<TeamInstance>
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
