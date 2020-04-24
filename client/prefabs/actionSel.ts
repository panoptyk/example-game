import * as Assets from "../assets";
import { ClientAPI, Info, Item } from "panoptyk-engine/dist/client";
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
  private stealItem: Item;

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
      if (GS.instance.thankableAgents.has(agent.model)) {
        this.createThankIcon(
          agent,
          GS.instance.thankableAgents.get(agent.model)
        );
      }
    }
    if (GS.instance.arrestableAgents.has(agent.model)) {
      this.createArrestIcon(
        agent,
        GS.instance.arrestableAgents.get(agent.model)
      );
    }

    if (GS.instance.attackableAgents.has(agent.model)) {
      this.createAttackIcon(
        agent,
        GS.instance.attackableAgents.get(agent.model)
      );
    }

    for (const item of GS.instance.stealItems) {
      if (agent.model.hasItem(item)) {
        this.createStealIcon(agent, item);
        break;
      }
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
      this.icons.get("tradeLine").destroy();
      this.icons.delete("trade");
      this.icons.delete("tradeLine");
      this.nextLoc--;
    } else if (inConvo && !this.icons.has("trade")) {
      this.createTradeIcon(agent);
    }

    if (
      this.icons.has("arrest") &&
      !GS.instance.arrestableAgents.has(agent.model)
    ) {
      this.icons.get("arrest").destroy();
      this.icons.delete("arrest");
      this.nextLoc--;
    } else if (
      !this.icons.has("arrest") &&
      GS.instance.arrestableAgents.has(agent.model)
    ) {
      this.createArrestIcon(
        agent,
        GS.instance.arrestableAgents.get(agent.model)
      );
    }

    if (
      this.icons.has("attack") &&
      !GS.instance.attackableAgents.has(agent.model)
    ) {
      this.icons.get("attack").destroy();
      this.icons.delete("attack");
      this.nextLoc--;
    } else if (
      !this.icons.has("attack") &&
      GS.instance.attackableAgents.has(agent.model)
    ) {
      this.createAttackIcon(
        agent,
        GS.instance.attackableAgents.get(agent.model)
      );
    }

    if (
      this.icons.has("thank") &&
      !GS.instance.thankableAgents.has(agent.model)
    ) {
      this.icons.get("thank").destroy();
      this.icons.delete("thank");
      this.nextLoc--;
    } else if (
      !this.icons.has("thank") &&
      GS.instance.thankableAgents.has(agent.model)
    ) {
      this.createThankIcon(agent, GS.instance.thankableAgents.get(agent.model));
    }

    if (!this.icons.has("steal")) {
      for (const item of GS.instance.stealItems) {
        if (agent.model.hasItem(item)) {
          this.createStealIcon(agent, item);
          break;
        }
      }
    } else if (
      this.icons.has("steal") &&
      (!agent.model.hasItem(this.stealItem) ||
        !GS.instance.stealItems.has(this.stealItem))
    ) {
      this.stealItem = undefined;
      this.icons.get("steal").destroy();
      this.icons.delete("steal");
      this.nextLoc--;
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
          if (ClientAPI.playerAgent.inventory.length > 0) {
            GS.instance.addErrorMessage(
              "You are only strong enough to carry 1 item!"
            );
          } else {
            ClientAPI.takeItems([item.model]).then(
              (res) => {
                UI.instance.setLeftTab(UI.LTABS.ITEMS);
              },
              (err) => {
                GS.instance.addErrorMessage(err.message);
              }
            );
          }
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
        const g = this.lines.pop();
        this.icons.set("tradeLine", g as any);
        this.lines.push(g);
        tradeIcon.inputEnabled = true;
        tradeIcon.events.onInputDown.add(() => {
          ClientAPI.requestTrade(agent.model).then(
            (res) => {
              GS.instance.logTradeRequest(agent.model);
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
        });
      }
    );
  }

  private createArrestIcon(agent: AgentSprite, warrant: Info) {
    const relativePos = this.createRelativeCoord();
    const arrestIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(2, 11)
    );
    this.group.addChild(arrestIcon);
    this.icons.set("arrest", arrestIcon);
    this.animateIcon(
      this.getCenterPos(arrestIcon),
      relativePos,
      arrestIcon,
      () => {
        arrestIcon.inputEnabled = true;
        arrestIcon.events.onInputDown.add(() => {
          console.log("arrest: " + agent.model.agentName);
          ClientAPI.arrestAgent(agent.model, warrant).then(
            (res) => {
              GS.instance.addConsoleMessage(
                "Successfully arrested " + agent.model.agentName
              );
              UI.instance.setLeftTab(UI.LTABS.INFO);
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
        });
      }
    );
  }

  private createStealIcon(agent: AgentSprite, item: Item) {
    this.stealItem = item;
    const relativePos = this.createRelativeCoord();
    const stealIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(0, 8)
    );
    this.group.addChild(stealIcon);
    this.icons.set("steal", stealIcon);
    this.animateIcon(
      this.getCenterPos(stealIcon),
      relativePos,
      stealIcon,
      () => {
        stealIcon.inputEnabled = true;
        stealIcon.events.onInputDown.add(() => {
          console.log("steal: " + agent.model.agentName);
          ClientAPI.stealItem(agent.model, item).then(
            (res) => {
              GS.instance.addConsoleMessage(
                "Successfully stole " + item.itemName
              );
              UI.instance.setLeftTab(UI.LTABS.ITEMS);
              this.icons.get("steal").destroy();
              this.icons.delete("steal");
              this.nextLoc--;
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
        });
      }
    );
  }

  private createAttackIcon(agent: AgentSprite, reason: Info) {
    const relativePos = this.createRelativeCoord();
    const attackIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(0, 3)
    );
    this.group.addChild(attackIcon);
    this.icons.set("attack", attackIcon);
    this.animateIcon(
      this.getCenterPos(attackIcon),
      relativePos,
      attackIcon,
      () => {
        attackIcon.inputEnabled = true;
        attackIcon.events.onInputDown.add(() => {
          console.log("attack: " + agent.model.agentName);
          ClientAPI.attackAgent(agent.model, reason).then(
            (res) => {
              GS.instance.addConsoleMessage(
                "Successfully attacked " + agent.model.agentName
              );
              UI.instance.setLeftTab(UI.LTABS.INFO);
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
        });
      }
    );
  }

  private createThankIcon(agent: AgentSprite, reason: Info) {
    const relativePos = this.createRelativeCoord();
    const thankIcon = this.sprite.game.make.sprite(
      0,
      0,
      Assets.Spritesheets.SpritesheetsIcons3232320.getName(),
      iconSel(6, 0)
    );
    this.group.addChild(thankIcon);
    this.icons.set("thank", thankIcon);
    this.animateIcon(
      this.getCenterPos(thankIcon),
      relativePos,
      thankIcon,
      () => {
        thankIcon.inputEnabled = true;
        thankIcon.events.onInputDown.add(() => {
          console.log("thank: " + agent.model.agentName);
          ClientAPI.thankAgent(agent.model, reason).then(
            (res) => {
              GS.instance.addConsoleMessage(
                "Successfully thanked " + agent.model.agentName
              );
              UI.instance.setLeftTab(UI.LTABS.INFO);
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
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
        if (
          !ClientAPI.playerAgent.faction ||
          ClientAPI.playerAgent.faction.factionType !== "police" ||
          ClientAPI.playerAgent.faction === agent.model.faction
        ) {
          ClientAPI.requestConversation(agent.model).then(
            (res) => {
              GS.instance.logConvoRequest(agent.model);
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
        } else {
          ClientAPI.interrogateAgent(agent.model).then(
            (res) => {
              GS.instance.addConsoleMessage(
                "Interrogating " + agent.model.agentName
              );
              UI.instance.setRightTab(UI.RTABS.CONVERSATION);
            },
            (err) => {
              GS.instance.addErrorMessage(err.message);
            }
          );
        }
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
        y: end.y,
      },
      150,
      Phaser.Easing.Quadratic.Out,
      true
    );
    tween.onComplete.add(() => {
      const g = this.sprite.game.add.graphics(
        sprite.width / 2,
        sprite.height / 2
      );
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
    this.lines.forEach((g) => {
      g.clear();
    });
    this.group.getAll().forEach((child) => {
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
