import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { AgentSprite } from "./agent";

export class ActionSel {
  private sprite: Phaser.Sprite;
  private group: Phaser.Group;
  private tradeIcon: Phaser.Sprite;
  private convIcon: Phaser.Sprite;

  constructor(sprite: Phaser.Sprite) {
    this.sprite = sprite;
    this.group = sprite.game.add.group();
  }

  public createAgentActions() {
    const agent = this.sprite as AgentSprite;
    this.sprite.parent.addChild(this.group);
    this.group.position.set(this.sprite.x, this.sprite.y);
    this.createConvIcon(agent);
    if (agent.model.conversation &&
    agent.model.conversation.contains_agent(ClientAPI.playerAgent)) {
      this.createTradeIcon(agent);
    }
  }

  public updateAgentActions() {
    const agent = this.sprite as AgentSprite;
    if (this.tradeIcon && !(agent.model.conversation &&
    agent.model.conversation.contains_agent(ClientAPI.playerAgent))) {
      this.group.remove(this.tradeIcon);
      this.tradeIcon.destroy();
    }
    else if (!this.tradeIcon && (agent.model.conversation &&
    agent.model.conversation.contains_agent(ClientAPI.playerAgent))) {
      this.createTradeIcon(agent);
    }
  }

  private createConvIcon(agent: AgentSprite) {
    this.convIcon = this.sprite.game.make.sprite(
      0,
      -15,
      Assets.Images.ImagesConv.getName()
    );
    this.group.addChild(this.convIcon);
    this.convIcon.inputEnabled = true;
    this.convIcon.events.onInputDown.add(() => {
      console.log("convo: " + agent.model.agentName);
      ClientAPI.requestConversation(agent.model);
    });
  }

  private createTradeIcon(agent: AgentSprite) {
    this.tradeIcon = this.sprite.game.make.sprite(
      24,
      -15,
      Assets.Images.ImagesTrade.getName()
    );
    this.group.addChild(this.tradeIcon);
    this.tradeIcon.inputEnabled = true;
    this.tradeIcon.events.onInputDown.add(() => {
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
    this.tradeIcon = undefined;
    this.convIcon = undefined;
  }
}
