import NewProjectPage from "./NewProjectPage";
import React from "react";
import LoginPage from "./LoginPage";
import MenuPage from "./MenuPage";
import useStateSafe from "../../util/react/hooks/useStateSafe";
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

    return <MenuPage titleGenerator={["New User", "New Team", "New Project", "The Loop", "Settings"]}>
        <NewUserPage />
        <NewTeamPage />
        <NewProjectPage teamPK={UNCONTROLLED_KEEP} />
        <TheLoopPage />
        <SettingsPage />
    </MenuPage>
}

