import React from "react";
import {list} from "ufdl-ts-client/functional/core/jobs/job_template";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";
import {nameFromJSON} from "../util/nameFromJSON";

export type JobTemplateSelectProps = Omit<ListSelectProps<JobTemplateInstance>, 'list' | 'labelFunction'>

export function JobTemplateSelect(
    props: JobTemplateSelectProps
) {
    return <ListSelect<JobTemplateInstance>
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
