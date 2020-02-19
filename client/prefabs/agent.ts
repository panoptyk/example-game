import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

export class AgentSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public animating = false;
  public model: Agent;
  public standLocIndex = -1;

  constructor(game: Phaser.Game, x: number, y: number, enableInput = true) {
    super(game, x, y, Assets.Spritesheets.SpritesheetsPlayerSpriteSheet484844.getName(), 0);

    this.animations.add("standing", [0, 1, 2], 3, true);
    this.animations.add("walk_forward", [9, 10, 11, 12], 4, true);
    this.animations.add("walking_side", [13, 14, 15, 16], 4, true);
    this.animations.add("walking_back", [17, 18, 19, 20], 4, true);
    this.animations.play("standing", 3, true);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.inputEnabled = enableInput;
    this.events.onInputDown.add(this.onDown);
  }

  private onDown(sprite) {
    if (sprite.menuCreated()) {
      sprite.destroyMenu();
    }
    else {
      sprite.createMenu();
    }
  }

  public menuCreated(): boolean {
    return this.menu !== undefined;
  }

  public createMenu() {
    this.menu = ActionSel.getMenu(this);
    this.menu.createActions();
  }

  public destroyMenu() {
    this.menu.destroy();
    this.menu = undefined;
  }
}
