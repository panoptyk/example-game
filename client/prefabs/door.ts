import * as Assets from "../assets";
import { ClientAPI, Agent, Room } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

export class DoorSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public model: Room;
  public hoverText: Phaser.Text;
  public graphics: Phaser.Graphics;

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

    this.graphics = this.game.make.graphics(0, 0);
    this.addChild(this.graphics);
    this.graphics.beginFill(0x000000, 0);
    this.graphics.lineStyle(2, 0xFFFFFF, 0.75);
    this.graphics.drawRect(-2, -2, this.width, this.height);
    this.graphics.endFill();

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
    this.graphics.clear();
    this.graphics.destroy();
    this.graphics = undefined;
    this.hoverText.destroy();
    this.hoverText = undefined;
    super.destroy();
  }
}
