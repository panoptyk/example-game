import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { AgentSprite } from "./agent";

export class ActionSel {
  private sprite: Phaser.Sprite;
  private group: Phaser.Group;

  constructor(sprite: Phaser.Sprite) {
    this.sprite = sprite;
    this.group = sprite.game.add.group();
  }

  public createAgentActions() {
    const agent = this.sprite as AgentSprite;
    this.sprite.parent.addChild(this.group);
    this.group.position.set(this.sprite.x, this.sprite.y);
    const convIcon = this.sprite.game.make.sprite(
      0,
      -15,
      Assets.Images.ImagesConv.getName()
    );
    const tradeIcon = this.sprite.game.make.sprite(
      24,
      -15,
      Assets.Images.ImagesTrade.getName()
    );
    this.group.addChild(convIcon);
    this.group.addChild(tradeIcon);
    convIcon.inputEnabled = true;
    convIcon.events.onInputDown.add(() => {
      console.log("convo: " + agent.model.agentName);
      ClientAPI.requestConversation(agent.model);
    });
    tradeIcon.inputEnabled = true;
    tradeIcon.events.onInputDown.add(() => {
        ClientAPI.requestTrade(agent.model);
    });
  }

  public createDoorActions() {
    // TODO: Nothing yet
  }

  public destroy() {
    this.group.getAll().forEach(child => {
      child.destroy();
    });
    this.group.destroy();
    this.group = undefined;
    this.sprite = undefined;
  }
}
