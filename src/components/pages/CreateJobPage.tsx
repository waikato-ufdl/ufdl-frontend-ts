//import {ChangePageFunction, Page, PageProps, SaveStateFunction} from "./Page";
//import React, {CElement} from "react";
//import "./MenuPage.css";
//import {MenuButton} from "./MenuButton";
//import {TeamSelect} from "../TeamSelect";
//import {ProjectSelect} from "../ProjectSelect";
//import {DomainSelect} from "../DomainSelect";
//import {FilterSpec} from "ufdl-ts-client/json/generated/FilterSpec";
//import {exactFilter} from "../../server/util/exactFilter";
//import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
//import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
//import {CreateFunction} from "../../server/util/types";
//import {LicenceSelect} from "../LicenceSelect";
//import {globalContext} from "../../globalContext";
//import {handleErrorResponse} from "../../util/responseError";
//
//export type CreateJobPageState = {
//    domain?: KnownDatasetCodesType
//    team_pk?: number
//    project_team_filter?: FilterSpec
//    project_pk?: number,
//    name?: string,
//    licence_pk?: number,
//    description?: string,
//    is_public: boolean
//}
//
//export type CreateJobPageProps = PageProps<CreateJobPageState> & {
//
//}
//
//const KnownDatasetCodes = [
//    "ic",
//    "od"
//] as const;
//
//type KnownDatasetCodesType = (typeof KnownDatasetCodes)[number];
//
//const createFunctions: {[key in KnownDatasetCodesType]: CreateFunction} = {
//    "ic": ICDataset.create,
//    "od": ODDataset.create
//};
//
//const DOMAIN_CODE_FILTER = (domainCode: string) => {return (KnownDatasetCodes as readonly string[]).includes(domainCode)};
//
//export class CreateJobPage extends Page<CreateJobPageProps, CreateJobPageState> {
//
//    static-ts initialise(
//        changePageFunction: ChangePageFunction,
//        saveStateFunction: SaveStateFunction<NewDatasetPageState>,
//        initialState?: Readonly<NewDatasetPageState>
//    ): CElement<NewDatasetPageProps, NewDatasetPage> {
//        if (initialState === undefined) {
//            initialState = {
//                is_public: false
//            }
//        }
//
//        return <NewDatasetPage changePageFunction={changePageFunction} saveStateFunction={saveStateFunction} initialState={initialState} />;
//    }
//
//    constructor(props: NewDatasetPageProps) {
//        super(props);
//        this.setTeam = this.setTeam.bind(this);
//        this.setProject = this.setProject.bind(this);
//        this.setDomain = this.setDomain.bind(this);
//        this.setLicence = this.setLicence.bind(this);
//    }
//
//    setTeam(pk?: number) {
//        this.setState(
//            {
//                team_pk: pk,
//                project_team_filter: pk === undefined ? undefined : exactFilter("team", pk)
//            }
//        );
//    }
//
//    setProject(pk?: number) {
//        this.setState(
//            {
//                project_pk: pk
//            }
//        );
//    }
//
//    setDomain(domain?: string) {
//        if (domain === undefined || !(KnownDatasetCodes as readonly string[]).includes(domain)) return;
//        this.setState({domain: domain as KnownDatasetCodesType});
//    }
//
//    setName(event: React.ChangeEvent<HTMLInputElement>) {
//        const value = event.target.value;
//        const newName = value === "" ? undefined : value;
//        if (newName !== this.state.name) this.setState({name: newName});
//    }
//
//    setLicence(pk?: number) {
//        this.setState({licence_pk: pk})
//    }
//
//    get canSubmit(): boolean {
//        return this.state.project_pk !== undefined &&
//            this.state.name !== undefined && this.state.name !== "" &&
//            this.state.licence_pk !== undefined &&
//            this.state.domain !== undefined
//    }
//
//    async createDataset() {
//        if (!this.canSubmit) return;
//
//        const createFunction = createFunctions[this.state.domain as KnownDatasetCodesType];
//
//        const success = await handleErrorResponse(
//            () => createFunction(
//                globalContext,
//                this.state.name as string,
//                this.state.project_pk as number,
//                this.state.licence_pk as number,
//                this.state.description as string,
//                this.state.is_public
//            )
//        );
//
//        if (success) this.clearForm()
//    }
//
//    clearForm() {
//        this.setState(
//            {
//                name: "",
//                description: "",
//                is_public: false
//            }
//        );
//    }
//
//    render() {
//        console.log(this.state);
//        return <div className={"NewDatasetPage Page"}>
//            <MenuButton changePageFunction={this.changePage.bind(this)} />
//            <form onSubmit={(event) => { event.preventDefault(); this.createDataset() }}>
//                <label>Domain: <DomainSelect onChange={this.setDomain} filter={DOMAIN_CODE_FILTER}/></label>
//                <label>Team: <TeamSelect onChange={this.setTeam} value={this.state.team_pk}/></label>
//                <label>
//                    Project:
//                    <ProjectSelect
//                        onChange={this.setProject}
//                        filter={this.state.project_team_filter}
//                        forceEmpty={this.state.team_pk === undefined}
//                        value={this.state.project_pk}
//                    />
//                </label>
//                <label>Name: <input value={this.state.name} onChange={this.setName.bind(this)}/></label>
//                <label>Licence: <LicenceSelect onChange={this.setLicence}/></label>
//                <label>Description: <input value={this.state.description} onChange={(event) => this.setState({description: event.target.value})}/></label>
//                <label>Public?: <input checked={this.state.is_public} type={"checkbox"} onClick={() => this.setState({is_public: !this.state.is_public})}/></label>
//                <input type={"submit"} value={"Submit"} disabled={!this.canSubmit}/>
//            </form>
//        </div>
//    }
//
//}
export {}