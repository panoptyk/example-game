import * as Assets from "../assets";

export class Loader {
    private static game: Phaser.Game;
    private static soundKeys: string[] = [];
    private static soundExtensionsPreference: string[] = SOUND_EXTENSIONS_PREFERENCE;

    private static loadImages() {
        const allImages = (Assets.Images as any);

        for (const image in allImages) {
            if (!this.game.cache.checkImageKey(allImages[image].getName())) {
                for (const option of Object.getOwnPropertyNames(allImages[image])) {
                    if (option !== "getName" && option.includes("get")) {
                        this.game.load.image(allImages[image].getName(), allImages[image][option]());
                    }
                }
            }
        }
    }

    private static loadSpritesheets() {
        const allSpritesheets = (Assets.Spritesheets as any);

        for (const spritesheet in allSpritesheets) {
            if (!this.game.cache.checkImageKey(allSpritesheets[spritesheet].getName())) {
                let imageOption = "";

                for (const option of Object.getOwnPropertyNames(allSpritesheets[spritesheet])) {
                    if (option !== "getName" && option !== "getFrameWidth" && option !== "getFrameHeight" && option !== "getFrameMax" && option !== "getMargin" && option !== "getSpacing" && option.includes("get")) {
                        imageOption = option;
                    }
                }

                this.game.load.spritesheet(allSpritesheets[spritesheet].getName(), allSpritesheets[spritesheet][imageOption](), allSpritesheets[spritesheet].getFrameWidth(), allSpritesheets[spritesheet].getFrameHeight(), allSpritesheets[spritesheet].getFrameMax(), allSpritesheets[spritesheet].getMargin(), allSpritesheets[spritesheet].getSpacing());
            }
        }
    }

    private static loadAtlases() {
        const allAtlases = (Assets.Atlases as any);

        for (const atlas in allAtlases) {
            if (!this.game.cache.checkImageKey(allAtlases[atlas].getName())) {
                let imageOption = "";
                let dataOption = "";

                for (const option of Object.getOwnPropertyNames(allAtlases[atlas])) {
                    if ((option === "getXML" || option === "getJSONArray" || option === "getJSONHash") && option.includes("get")) {
                        dataOption = option;
                    } else if (option !== "getName" && option !== "Frames" && option.includes("get")) {
                        imageOption = option;
                    }
                }

                if (dataOption === "getXML") {
                    this.game.load.atlasXML(allAtlases[atlas].getName(), allAtlases[atlas][imageOption](), allAtlases[atlas].getXML());
                } else if (dataOption === "getJSONArray") {
                    this.game.load.atlasJSONArray(allAtlases[atlas].getName(), allAtlases[atlas][imageOption](), allAtlases[atlas].getJSONArray());
                } else if (dataOption === "getJSONHash") {
                    this.game.load.atlasJSONHash(allAtlases[atlas].getName(), allAtlases[atlas][imageOption](), allAtlases[atlas].getJSONHash());
                }
            }
        }
    }

    private static orderAudioSourceArrayBasedOnSoundExtensionPreference(soundSourceArray: string[]): string[] {
        let orderedSoundSourceArray: string[] = [];

        for (const e in this.soundExtensionsPreference) {
            const sourcesWithExtension: string[] = soundSourceArray.filter((el) => {
                return (el.substring(el.lastIndexOf(".") + 1, el.length) === this.soundExtensionsPreference[e]);
            });

            orderedSoundSourceArray = orderedSoundSourceArray.concat(sourcesWithExtension);
        }

        return orderedSoundSourceArray;
    }

    private static loadAudio() {
        const allAudio = (Assets.Audio as  any);

        for (const audio in allAudio) {
            const soundName = allAudio[audio].getName();
            this.soundKeys.push(soundName);

            if (!this.game.cache.checkSoundKey(soundName)) {
                let audioTypeArray = [];

                for (const option of Object.getOwnPropertyNames(allAudio[audio])) {
                    if (option !== "getName" && option.includes("get")) {
                        audioTypeArray.push(allAudio[audio][option]());
                    }
                }

                audioTypeArray = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray);

                this.game.load.audio(soundName, audioTypeArray, true);
            }
        }
    }

    private static loadAudiosprites() {
        const allAudiosprites = (Assets.Audiosprites as any);

        for (const audio in allAudiosprites) {
            const soundName = allAudiosprites[audio].getName();
            this.soundKeys.push(soundName);

            if (!this.game.cache.checkSoundKey(soundName)) {
                let audioTypeArray = [];

                for (const option of Object.getOwnPropertyNames(allAudiosprites[audio])) {
                    if (option !== "getName" && option !== "getJSON" && option !== "Sprites" && option.includes("get")) {
                        audioTypeArray.push(allAudiosprites[audio][option]());
                    }
                }

                audioTypeArray = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray);

                this.game.load.audiosprite(soundName, audioTypeArray, allAudiosprites[audio].getJSON(), undefined, true);
            }
        }
    }

    private static loadBitmapFonts() {
        const allBitmapFonts = (Assets.BitmapFonts as any);

        for (const font in allBitmapFonts) {
            if (!this.game.cache.checkBitmapFontKey(allBitmapFonts[font].getName())) {
                let imageOption = "";
                let dataOption = "";

                for (const option of Object.getOwnPropertyNames(allBitmapFonts[font])) {
                    if ((option === "getXML" || option === "getFNT") && option.includes("get")) {
                        dataOption = option;
                    } else if (option !== "getName" && option.includes("get")) {
                        imageOption = option;
                    }
                }

                this.game.load.bitmapFont(allBitmapFonts[font].getName(), allBitmapFonts[font][imageOption](), allBitmapFonts[font][dataOption]());
            }
        }
    }

    private static loadJSON() {
        const allJSON = (Assets.JSON as any);

        for (const json in allJSON) {
            if (!this.game.cache.checkJSONKey(allJSON[json].getName())) {
                this.game.load.json(allJSON[json].getName(), allJSON[json].getJSON(), true);
            }
        }
    }

    private static loadTilemapJSON() {
        const allTilemapJSON = (Assets.TilemapJSON as any);

        for (const json in allTilemapJSON) {
            if (!this.game.cache.checkTilemapKey(allTilemapJSON[json].getName())) {
                this.game.load.tilemap(allTilemapJSON[json].getName(), allTilemapJSON[json].getJSON(), undefined, Phaser.Tilemap.TILED_JSON);
            }
        }
    }

    private static loadXML() {
        const allXML = (Assets.XML as any);

        for (const xml in allXML) {
            if (!this.game.cache.checkXMLKey(allXML[xml].getName())) {
                this.game.load.xml(allXML[xml].getName(), allXML[xml].getXML(), true);
            }
        }
    }

    private static loadText() {
        const allText = (Assets.Text as any);

        for (const text in allText) {
            if (!this.game.cache.checkTextKey(allText[text].getName())) {
                this.game.load.text(allText[text].getName(), allText[text].getTXT(), true);
            }
        }
    }

    private static loadScripts() {
        const allScripts = (Assets.Scripts as any);

        for (const script in Assets.Scripts) {
            this.game.load.script(allScripts[script].getName(), allScripts[script].getJS());
        }
    }

    private static loadShaders() {
        const allShaders = (Assets.Shaders as any);

        for (const shader in allShaders) {
            if (!this.game.cache.checkShaderKey(allShaders[shader].getName())) {
                this.game.load.shader(allShaders[shader].getName(), allShaders[shader].getFRAG(), true);
            }
        }
    }

    private static loadMisc() {
        const allMisc = (Assets.Misc as any);

        for (const misc in allMisc) {
            if (!this.game.cache.checkBinaryKey(allMisc[misc].getName())) {
                this.game.load.binary(allMisc[misc].getName(), allMisc[misc].getFile());
            }
        }
    }

    public static loadAllAssets(game: Phaser.Game, onComplete?: (() => void), onCompleteContext?: any) {
        this.game = game;

        if (onComplete) {
            this.game.load.onLoadComplete.addOnce(onComplete, onCompleteContext);
        }

        this.loadImages();
        this.loadSpritesheets();
        this.loadAtlases();
        this.loadAudio();
        this.loadAudiosprites();
        this.loadBitmapFonts();
        this.loadJSON();
        this.loadTilemapJSON();
        this.loadXML();
        this.loadText();
        this.loadScripts();
        this.loadShaders();
        this.loadMisc();

        if ((this.game.load as any)._fileList.length === 0) {
            this.game.load.onLoadComplete.dispatch();
        }
    }

    public static waitForSoundDecoding(onComplete: (() => void), onCompleteContext?: any) {
        if (this.soundKeys.length > 0) {
            this.game.sound.setDecodedCallback(this.soundKeys, onComplete, onCompleteContext);
        } else {
            onComplete.call(onCompleteContext);
        }
    }
}
