import * as Assets from "../assets";
import { ClientAPI, Agent, Room } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

export class DoorSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public model: Room;
  public hoverText: Phaser.Text;

  constructor(
    game: Phaser.Game,
    x: number,
    y: number,
    width: number,
    height: number,
    room: Room,
    enableInput = true
  ) {
    super(game, x, y, new Phaser.RenderTexture(game, width, height));
    this.model = room;
    this.alpha = 1;

    // this.createHoverText();

    this.inputEnabled = enableInput;
    this.events.onInputDown.add(this.onDown);
  }

  public createHoverText() {
    const style = { font: "14px Arial", fill: "#ffffff" };
    this.hoverText = this.game.add.text(0, 0, this.model.roomName, style);
    this.hoverText.position.set(
      this.world.x + (this.width * this.worldScale.x - this.hoverText.width) / 2,
      this.world.y - 20
    );

    // this.events.onInputOver.add(() => {
    //     this.hoverText.visible = true;
    // });
    // this.events.onInputOut.add(() => {
    //     this.hoverText.visible = false;
    // });
  }

  private onDown(sprite: DoorSprite) {
    if (sprite.menuCreated()) {
      sprite.destroyMenu();
    } else {
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
    this.hoverText.destroy();
    this.hoverText = undefined;
    super.destroy();
  }
}
