import * as Assets from "../assets";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { UI } from "../ui/ui";
import { AgentSprite } from "./agent";
import { DoorSprite } from "./door";
import GS from "./../states/game";
import { ItemSprite } from "./item";

const iconSel = function(x, y) {
  return y * 16 + x;
};

export class ActionSel {
  static DIST_FROM_SPRITE = 50; // px
  static ANGLE_PER_ITEM = 55; // degrees
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
  private lines: Phaser.Graphics[];
  private nextLoc: number;

  constructor(sprite: Phaser.Sprite) {
    this.sprite = sprite;
    this.group = sprite.game.add.group();
    this.icons = new Map();
    this.lines = [];
    this.nextLoc = 0;
    ActionSel.currentMenu = this;
    UI.instance.setInspectTarget((sprite as any).model);
    UI.instance.setLeftTab(UI.LTABS.INSPECT);
  }

  // Create Actions //
  public createActions() {
    this.group.position.set(this.sprite.world.x, this.sprite.world.y);
    if (this.sprite instanceof AgentSprite) {
      this.createAgentActions();
    } else if (this.sprite instanceof DoorSprite) {
      this.createDoorActions();
    } else if (this.sprite instanceof ItemSprite) {
      this.createItemActions();
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

  public createItemActions() {
    const item = this.sprite as ItemSprite;
    this.createPickupIcon(item);
  }

  // Update Call //
  public update() {
    if (this.sprite instanceof AgentSprite) {
      this.updateAgentActions();
    } else if (this.sprite instanceof DoorSprite) {
      this.updateDoorActions();
    } else if (this.sprite instanceof DoorSprite) {
      this.updateItemActions();
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

  public updateItemActions() {
    // NO-OP
  }

  // Create Icons //
  private createEnterIcon(door: DoorSprite) {
    const relativePos = this.createRelativeCoord();
    const enterIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(0, 2)
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

  private createPickupIcon(item: ItemSprite) {
    const relativePos = this.createRelativeCoord();
    const pickupIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(0, 8)
    );
    this.group.addChild(pickupIcon);
    this.icons.set("pickup", pickupIcon);
    this.animateIcon(
      this.getCenterPos(pickupIcon),
      relativePos,
      pickupIcon,
      () => {
        pickupIcon.inputEnabled = true;
        pickupIcon.events.onInputDown.add(() => {
          ClientAPI.takeItems([item.model]);
        });
      }
    );
  }

  private createTradeIcon(agent: AgentSprite) {
    const relativePos = this.createRelativeCoord();
    const tradeIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(11, 12)
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
          ClientAPI.requestTrade(agent.model).then(res => {
            GS.instance.logTradeRequest(agent.model);
          });
        });
      }
    );
  }

  private createConvIcon(agent: AgentSprite) {
    const relativePos = this.createRelativeCoord();
    const convIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(0, 4)
    );
    this.group.addChild(convIcon);
    this.icons.set("conversation", convIcon);
    this.animateIcon(this.getCenterPos(convIcon), relativePos, convIcon, () => {
      convIcon.inputEnabled = true;
      convIcon.events.onInputDown.add(() => {
        console.log("convo: " + agent.model.agentName);
        ClientAPI.requestConversation(agent.model).then(res => {
          GS.instance.logConvoRequest(agent.model);
        });
      });
    });
  }

  private animateIcon(
    start: Phaser.Point,
    relativeEnd: Phaser.Point,
    sprite: Phaser.Sprite,
    callback: () => any
  ) {
    sprite.position.set(start.x, start.y);
    const end = Phaser.Point.add(start, relativeEnd);
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
      const g = this.sprite.game.add.graphics(sprite.width / 2, sprite.height / 2);
      this.group.addChildAt(g, 0);
      this.lines.push(g);
      g.beginFill();
      g.lineStyle(1, 0xffffff, 1);
      g.moveTo(start.x, start.y);
      g.lineTo(end.x, end.y);
      g.endFill();
      callback();
    });
  }

  private createRelativeCoord(): Phaser.Point {
    const angleAdjust =
      ActionSel.START_ANGLE + ActionSel.ANGLE_PER_ITEM * this.nextLoc++;
    let point = new Phaser.Point(ActionSel.DIST_FROM_SPRITE, 0);
    point = point.rotate(0, 0, angleAdjust, true, ActionSel.DIST_FROM_SPRITE);
    return point;
  }

  private getCenterPos(icon: Phaser.Sprite): Phaser.Point {
    return new Phaser.Point(
      (this.sprite.width * this.sprite.worldScale.x - icon.width) / 2,
      (this.sprite.height * this.sprite.worldScale.y - icon.height) / 2
    );
  }

  public destroy() {
    this.lines.forEach(g => {
      g.clear();
    });
    this.group.getAll().forEach(child => {
      child.destroy();
    });
    this.lines = [];
    this.group.destroy();
    this.group = undefined;
    this.sprite = undefined;
    ActionSel.currentMenu = undefined;
    UI.instance.setInspectTarget(undefined);
  }
}
