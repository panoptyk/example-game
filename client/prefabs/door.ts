import * as Assets from "../assets";
import { ClientAPI, Agent, Room } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

export class DoorSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public model: Room;
  public hoverText: Phaser.Text;

  constructor(game: Phaser.Game, x: number, y: number, width: number, height: number, room: Room,  enableInput = true) {
    super(game, x, y);
    this.model = room;
    this.width = width;
    this.height = height;

    this.alpha = 1;
    const style = { font: "25px Arial", fill: "#ffffff" };
    this.hoverText = this.game.make.text(0, 0, room.roomName, style);
    this.addChild(this.hoverText);
    this.hoverText.position.set((this.width - this.hoverText.width) / 2, -28);
    this.hoverText.visible = false;

    this.inputEnabled = enableInput;
    this.events.onInputDown.add(this.onDown);
    this.events.onInputOver.add(() => {
        this.hoverText.visible = true;
    });
    this.events.onInputOut.add(() => {
        this.hoverText.visible = false;
    });
  }

  private onDown(sprite: DoorSprite) {
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

  public destroy() {
    if (this.menu) {
      this.menu.destroy();
    }
    super.destroy();
  }

}
