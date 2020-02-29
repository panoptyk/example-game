import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { UI } from "../ui/ui";
import { AgentSprite } from "./agent";
import { DoorSprite } from "./door";

export class ActionSel {
  static DIST_FROM_SPRITE = 40; // px
  static ANGLE_PER_ITEM = 30; // degrees
  static START_ANGLE = 225; // degrees

  static currentMenu: ActionSel;
  static getMenu(sprite: Phaser.Sprite): ActionSel {
    if (ActionSel.currentMenu && ActionSel.currentMenu.sprite === sprite) {
      return ActionSel.currentMenu;
    } else if (ActionSel.currentMenu) {
      (ActionSel.currentMenu.sprite as any).destroyMenu();
    }
    return new ActionSel(sprite);
  }
  static doorEnterCallback: (sprite: DoorSprite) => any = () => {};

  private sprite: Phaser.Sprite;
  private group: Phaser.Group;
  private icons: Map<string, Phaser.Sprite>;
  private nextLoc: number;

  constructor(sprite: Phaser.Sprite) {
    this.sprite = sprite;
    this.group = sprite.game.add.group();
    this.icons = new Map();
    this.nextLoc = 0;
    ActionSel.currentMenu = this;
    UI.instance.setInspectTarget((sprite as any).model);
    UI.instance.setLeftTab(UI.LTABS.INSPECT);
  }

  // Create Actions //
  public createActions() {
    this.sprite.parent.addChild(this.group);
    this.group.position.set(this.sprite.x, this.sprite.y);
    this.group.scale.set(1 / this.sprite.parent.worldScale.x);
    if (this.sprite instanceof AgentSprite) {
      this.createAgentActions();
    } else if (this.sprite instanceof DoorSprite) {
      this.createDoorActions();
    }
  }

  public createAgentActions() {
    const agent = this.sprite as AgentSprite;
    this.createConvIcon(agent);
    if (
      agent.model.conversation &&
      agent.model.conversation.contains_agent(ClientAPI.playerAgent)
    ) {
      this.createTradeIcon(agent);
    }
  }

  public createDoorActions() {
    const door = this.sprite as DoorSprite;
    this.createEnterIcon(door);
  }

  // Update Call //
  public update() {
    if (this.sprite instanceof AgentSprite) {
      this.updateAgentActions();
    } else if (this.sprite instanceof DoorSprite) {
      this.updateDoorActions();
    }
  }

  public updateAgentActions() {
    const agent = this.sprite as AgentSprite;
    const inConvo =
      ClientAPI.playerAgent.conversation &&
      ClientAPI.playerAgent.conversation.contains_agent(agent.model);

    if (this.icons.has("trade") && !inConvo) {
      this.icons.get("trade").destroy();
      this.icons.delete("trade");
      this.nextLoc--;
    } else if (inConvo && !this.icons.has("trade")) {
      this.createTradeIcon(agent);
    }
  }

  public updateDoorActions() {
    // NO-OP
  }

  // Create Icons //
  private createEnterIcon(door: DoorSprite) {
    const relativePos = this.createCoord();
    const enterIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Images.ImagesConv.getName()
    );
    this.group.addChild(enterIcon);
    this.icons.set("enter", enterIcon);
    this.animateIcon(
      this.getCenterPos(enterIcon),
      relativePos,
      enterIcon,
      () => {
        enterIcon.inputEnabled = true;
        enterIcon.events.onInputDown.add(() => {
          ActionSel.doorEnterCallback(door);
        });
      }
    );
  }

  private createTradeIcon(agent: AgentSprite) {
    const relativePos = this.createCoord();
    const tradeIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Images.ImagesTrade.getName()
    );
    this.group.addChild(tradeIcon);
    this.icons.set("trade", tradeIcon);
    this.animateIcon(
      this.getCenterPos(tradeIcon),
      relativePos,
      tradeIcon,
      () => {
        tradeIcon.inputEnabled = true;
        tradeIcon.events.onInputDown.add(() => {
          ClientAPI.requestTrade(agent.model);
        });
      }
    );
  }

  private createConvIcon(agent: AgentSprite) {
    const relativePos = this.createCoord();
    const convIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Images.ImagesConv.getName()
    );
    this.group.addChild(convIcon);
    this.icons.set("conversation", convIcon);
    this.animateIcon(this.getCenterPos(convIcon), relativePos, convIcon, () => {
      convIcon.inputEnabled = true;
      convIcon.events.onInputDown.add(() => {
        console.log("convo: " + agent.model.agentName);
        ClientAPI.requestConversation(agent.model);
      });
    });
  }

  private createCoord(): Phaser.Point {
    const angleAdjust =
      ActionSel.START_ANGLE + ActionSel.ANGLE_PER_ITEM * this.nextLoc++;
    let point = new Phaser.Point(ActionSel.DIST_FROM_SPRITE, 0);
    point = point.rotate(0, 0, angleAdjust, true, ActionSel.DIST_FROM_SPRITE);
    point = point.add(
      this.sprite.width / this.group.scale.x / 2,
      this.sprite.height / this.group.scale.y / 2
    );
    return point;
  }

  private animateIcon(
    start: Phaser.Point,
    end: Phaser.Point,
    sprite: Phaser.Sprite,
    callback: () => any
  ) {
    sprite.position.set(start.x, start.y);
    const tween = this.sprite.game.add.tween(sprite).to(
      {
        x: end.x,
        y: end.y
      },
      150,
      Phaser.Easing.Quadratic.Out,
      true
    );
    tween.onComplete.add(() => {
      callback();
    });
  }

  private getCenterPos(icon: Phaser.Sprite): Phaser.Point {
    return new Phaser.Point(
      (this.sprite.width / this.group.scale.x - icon.width) / 2,
      (this.sprite.height / this.group.scale.y - icon.height) / 2
    );
  }

  public destroy() {
    this.group.getAll().forEach(child => {
      child.destroy();
    });
    this.group.destroy();
    this.group = undefined;
    this.sprite = undefined;
    ActionSel.currentMenu = undefined;
    UI.instance.setInspectTarget(undefined);
  }
}
