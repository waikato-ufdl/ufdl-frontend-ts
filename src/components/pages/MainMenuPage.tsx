import DummyPage from "./DummyPage";
import NewProjectPage from "./NewProjectPage";
import React from "react";
import LoginPage from "./LoginPage";
import MenuPage from "./MenuPage";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import NewDatasetPage from "./NewDatasetPage";
import NewTeamPage from "./NewTeamPage";
import TheLoopPage from "./loop/TheLoopPage";
import ImageClassificationAnnotatorPage from "./icap/ImageClassificationAnnotatorPage";

export function MainMenuPage() {

    const [loggedIn, setLoggedIn] = useStateSafe<boolean>(() => false);

    if (!loggedIn) {
        return <LoginPage id={"Log In"} onLogin={() => setLoggedIn(true)} />
    }

    return <MenuPage titleGenerator={["Dummy Page", "New Team", "New Project", "New Dataset", "ICAP", "The Loop"]}>
        <DummyPage pings={42} />
        <NewTeamPage />
        <NewProjectPage />
        <NewDatasetPage />
        <ImageClassificationAnnotatorPage />
        <TheLoopPage />
    </MenuPage>
}
