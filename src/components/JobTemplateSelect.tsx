import React from "react";
import {list} from "ufdl-ts-client/functional/core/jobs/job_template";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";

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
