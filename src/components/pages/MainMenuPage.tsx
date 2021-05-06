import DummyPage from "./DummyPage";
import NewProjectPage from "./NewProjectPage";
import React from "react";
import LoginPage from "./LoginPage";
import MenuPage from "./MenuPage";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import NewDatasetPage from "./NewDatasetPage";
import NewTeamPage from "./NewTeamPage";
import TheLoopPage from "./loop/TheLoopPage";
import ImageClassificationAnnotatorPage from "./annotation/icap/ImageClassificationAnnotatorPage";
import {UNCONTROLLED_KEEP} from "../../util/react/hooks/useControllableState";
import NewUserPage from "./NewUserPage";

export function MainMenuPage() {

    const [loggedIn, setLoggedIn] = useStateSafe<boolean>(() => false);

    if (!loggedIn) {
        return <LoginPage
            id={"Log In"}
            username={UNCONTROLLED_KEEP}
            onLogin={() => setLoggedIn(true)}
        />
    }

    return <MenuPage titleGenerator={["Dummy Page", "New User", "New Team", "New Project", "New Dataset", "ICAP", "The Loop"]}>
        <DummyPage pings={42} />
        <NewUserPage />
        <NewTeamPage />
        <NewProjectPage teamPK={UNCONTROLLED_KEEP} />
        <NewDatasetPage domain={UNCONTROLLED_KEEP} licencePK={UNCONTROLLED_KEEP} isPublic={UNCONTROLLED_KEEP} from={UNCONTROLLED_KEEP}/>
        <ImageClassificationAnnotatorPage />
        <TheLoopPage />
    </MenuPage>
}
