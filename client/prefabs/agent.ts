import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

const SpriteMap = {
  test: Assets.Spritesheets.SpritesheetsMale22323212.getName(),
  agent2: Assets.Spritesheets.SpritesheetsMale22323212.getName()
};
const ToSprite = function(agent: Agent) {
  const sprite = SpriteMap[agent.agentName];
  if (sprite) {
    return sprite;
  }
  return Assets.Spritesheets.SpritesheetsMale21323212.getName();
};

const iconSel = function(x, y) {
  return y * 16 + x;
};

export class AgentSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public animating = false;
  public curTween: Phaser.Tween = undefined;
  public model: Agent;
  public standLocIndex = -1;
  private hoverText;
  private inConvo = false;
  private chatBubble;

  constructor(
    game: Phaser.Game,
    x: number,
    y: number,
    agent: Agent,
    enableInput = true
  ) {
    super(
      game,
      x,
      y,
      Assets.Spritesheets.SpritesheetsMale21323212.getName(),
      0
    );
    this.model = agent;
    this.loadTexture(ToSprite(agent), 1);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    const style = { font: "25px Arial", fill: "#ffffff" };
    this.hoverText = this.game.make.text(0, 0, agent.agentName, style);
    this.addChild(this.hoverText);
    this.hoverText.position.set((this.width - this.hoverText.width) / 2, -28);
    this.hoverText.visible = true;

    this.createChatBubble();

    this.inputEnabled = enableInput;
    this.events.onInputDown.add(this.onDown);
    // this.events.onInputOver.add(() => {
    //   this.hoverText.visible = !this.inConvo;
    // });
    // this.events.onInputOut.add(() => {
    //   this.hoverText.visible = false;
    // });
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

  public busy(): boolean {
    return this.animating;
  }

  private createChatBubble() {
    this.chatBubble = this.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIconsTransparent3232320.getName(),
      iconSel(1, 4)
    );
    this.addChild(this.chatBubble);
    this.chatBubble.position.set((this.width - this.chatBubble.width) / 2, -this.chatBubble.height);
    this.chatBubble.visible = false;
  }

  public update() {
    this.inConvo = this.model.conversation !== undefined;
    this.chatBubble.visible = this.inConvo;
  }

  public move(
    start: Phaser.Point,
    end: Phaser.Point,
    callback = function() {}
  ) {
    this.visible = false;
    if (this.curTween) {
      this.curTween.stop();
      this.curTween = undefined;
    }
    this.animating = true;
    this.position.set(start.x, start.y);
    const ms = start.distance(end, true) * 0.8;
    const tween = this.game.add.tween(this).to(
      {
        x: end.x,
        y: end.y
      },
      ms,
      Phaser.Easing.Linear.None,
      true
    );
    tween.onComplete.add(() => {
      this.animating = false;
      this.curTween = undefined;
      callback();
    });
    this.curTween = tween;
    this.visible = true;
  }
}
