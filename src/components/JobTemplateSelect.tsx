import React from "react";
import {list} from "ufdl-ts-client/functional/core/jobs/job_template";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";

export type JobTemplateSelectProps = Omit<ListSelectProps, 'list' | 'labelFunction'>

export function JobTemplateSelect(props: JobTemplateSelectProps) {
    return <ListSelect
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
