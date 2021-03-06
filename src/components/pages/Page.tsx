import React from "react";
import "./Page.css";
import {augmentClass} from "../../util/react/augmentClass";

export type PageProps = React.HTMLAttributes<HTMLDivElement>

export default function Page(props: PageProps) {
    return <div {...augmentClass(props, "Page")} />
}
