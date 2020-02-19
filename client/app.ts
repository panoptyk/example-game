import "p2";
import "pixi";
import "phaser";

import * as WebFontLoader from "webfontloader";

import Boot from "./states/boot";
import Preload from "./states/preloader";
import { Login } from "./states/login";
import Game from "./states/game";
import * as Utils from "./utils/utils";
import * as Assets from "./assets";

import { ClientAPI, Room, logger } from "panoptyk-engine/dist/client";
import Vue from "vue";
import Buefy from "Buefy";
import { UI } from "./ui/ui";

class App extends Phaser.Game {
    constructor(config: Phaser.IGameConfig) {
        super (config);

        this.state.add("Boot", Boot, false);
        this.state.add("Preload", Preload, false);
        this.state.add("Login", Login, false);
        this.state.add("Game", Game, false);

        this.state.start("Boot");
    }
}

function startApp(): void {
    Vue.config.productionTip = false;
    Vue.use(Buefy, {
        defaultIconPack: "mdi"
    });
    const ui = UI.instance;
    let gameWidth = 700;
    let gameHeight = 500;

    if (SCALE_MODE === "USER_SCALE") {
        const screenMetrics: Utils.ScreenMetrics = Utils.ScreenUtils.calculateScreenMetrics(gameWidth, gameHeight, gameWidth, gameHeight);

        gameWidth = screenMetrics.gameWidth;
        gameHeight = screenMetrics.gameHeight;
    }

    // There are a few more options you can set if needed, just take a look at Phaser.IGameConfig
    const gameConfig: Phaser.IGameConfig = {
        width: gameWidth,
        height: gameHeight,
        renderer: Phaser.AUTO,
        parent: "phaser-game",
        resolution: 1
    };

    // ClientAPI.init("71.93.55.224:1791");
    ClientAPI.init();
    logger.silence();
    const app = new App(gameConfig);
}

(window as any).ClientAPI = ClientAPI;
(window as any).Room = Room;

window.onload = () => {
    let webFontLoaderOptions: any = undefined;
    const webFontsToLoad: string[] = GOOGLE_WEB_FONTS;

    if (webFontsToLoad.length > 0) {
        webFontLoaderOptions = (webFontLoaderOptions || {});

        webFontLoaderOptions.google = {
            families: webFontsToLoad
        };
    }

    if (Object.keys(Assets.CustomWebFonts).length > 0) {
        webFontLoaderOptions = (webFontLoaderOptions || {});

        webFontLoaderOptions.custom = {
            families: [],
            urls: []
        };

        const allCustomWebFonts = (Assets.CustomWebFonts as any);

        for (const font in allCustomWebFonts) {
            webFontLoaderOptions.custom.families.push(allCustomWebFonts[font].getFamily());
            webFontLoaderOptions.custom.urls.push(allCustomWebFonts[font].getCSS());
        }
    }

    if (webFontLoaderOptions === null) {
        // Just start the game, we don't need any additional fonts
        startApp();
    } else {
        // Load the fonts defined in webFontsToLoad from Google Web Fonts, and/or any Local Fonts then start the game knowing the fonts are available
        webFontLoaderOptions.active = startApp;

        WebFontLoader.load(webFontLoaderOptions);
    }
};
