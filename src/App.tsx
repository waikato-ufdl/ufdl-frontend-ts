import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";
import {ImageCache, UFDLImageCacheProvider} from "./server/ImageCacheContext";

export default function App() {
    const context = new UFDLServerContext(window.location.origin, "", "");
    const imageCache: ImageCache = new Map();

    return <div className="App fullScreen">
        <UFDLImageCacheProvider context={imageCache}>
            <Window context={context}>
                <MainMenuPage />
            </Window>
        </UFDLImageCacheProvider>
    </div>
}
