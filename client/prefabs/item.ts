import * as Assets from "../assets";
import { ClientAPI, Item } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

const iconSel = function(x, y) {
  return y * 16 + x;
};
const SpriteMap = {};
const FrameMap = {};
const ToSprite = function(item: Item): { key: string; frame: number } {
  const key = SpriteMap[item.itemName];
  const frame = FrameMap[item.itemName];
  if (key) {
    return { key, frame };
  }
  return {
    key: Assets.Spritesheets.SpritesheetsIconsTransparent3232320.getName(),
    frame: iconSel(11, 11)
  };
};

export class ItemSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public animating = false;
  public curTween: Phaser.Tween = undefined;
  public model: Item;
  public standLocIndex = -1;
  private hoverText;

  constructor(
    game: Phaser.Game,
    x: number,
    y: number,
    model: Item,
    enableInput = true
  ) {
    super(
      game,
      x,
      y,
      Assets.Spritesheets.SpritesheetsIconsTransparent3232320.getName(),
      iconSel(11, 11)
    );
    this.model = model;
    const sprite = ToSprite(model);
    this.loadTexture(sprite.key, sprite.frame);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    const style = { font: "25px Arial", fill: "#ffffff" };
    this.hoverText = this.game.make.text(0, 0, model.itemName, style);
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

  private onDown(sprite) {
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
    super.destroy();
  }
}
