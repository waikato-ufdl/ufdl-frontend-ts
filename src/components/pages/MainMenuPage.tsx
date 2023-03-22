import NewProjectPage from "./NewProjectPage";
import React from "react";
import LoginPage from "./LoginPage";
import MenuPage from "./MenuPage";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import NewDatasetPage from "./NewDatasetPage";
import NewTeamPage from "./NewTeamPage";
import TheLoopPage from "./loop/TheLoopPage";
import {UNCONTROLLED_KEEP} from "../../util/react/hooks/useControllableState";
import NewUserPage from "./NewUserPage";
import {DEFAULT} from "../../util/typescript/default";
import SettingsPage from "./SettingsPage";

export function MainMenuPage() {

    const [loggedIn, setLoggedIn] = useStateSafe<boolean>(() => false);

    if (!loggedIn) {
        return <LoginPage
            id={"Log In"}
            username={UNCONTROLLED_KEEP}
            onLogin={() => setLoggedIn(true)}
        />
    }

    return <MenuPage titleGenerator={["Create User", "Create Team", "Create Project", "Create Dataset", "Start", "Settings"]}>
        <NewUserPage />
        <NewTeamPage />
        <NewProjectPage teamPK={UNCONTROLLED_KEEP} />
        <NewDatasetPage domain={UNCONTROLLED_KEEP} licencePK={UNCONTROLLED_KEEP} isPublic={UNCONTROLLED_KEEP}/>
        <TheLoopPage />
        <SettingsPage />
    </MenuPage>
}

