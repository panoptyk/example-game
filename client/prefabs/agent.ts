import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { ActionSel } from "./actionSel";

const SpriteMap = {
  "test": Assets.Spritesheets.SpritesheetsMale22323212.getName(),
  "agent2": Assets.Spritesheets.SpritesheetsMale22323212.getName()
};
const ToSprite = function(agent: Agent) {
  const sprite = SpriteMap[agent.agentName];
  if (sprite) {
    return sprite;
  }
  return Assets.Spritesheets.SpritesheetsMale21323212.getName();
};

export class AgentSprite extends Phaser.Sprite {
  private menu: ActionSel;
  public animating = false;
  public model: Agent;
  public standLocIndex = -1;
  private hoverText;

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
    this.loadTexture(ToSprite(agent));
    this.animations.add("standing", [1], 0, true);
    this.animations.play("standing", 0, true);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    const style = { font: "25px Arial", fill: "#ffffff" };
    this.hoverText = this.game.make.text(0, 0, agent.agentName, style);
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
}
