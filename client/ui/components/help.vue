<template>
  <div id="help-window">
    <b-modal :active.sync="showHelp" :onCancel="onClose" scroll="keep">
      <div class="card" id="help-card">
        <b-tabs v-model="activeTab">
          <b-tab-item label="Current Quest">
            <span
              v-for="b in questText"
              v-bind:key="b.text"
              v-bind:class="b.type"
            >
              {{ b.text }}
            </span>
            <span v-if="quest.id">
              <br>
              <br>
              You can turn in a quest when in a conversation with the person who
              gave it. You must select the info you wish to turn-in and click
              the "Turn in Quest Info" button. The quest giver marks the quest
              as complete when you turn in something interesting to them; he/she
              will likely not complete the quest if you tell them something they
              already know.
              <img src="./assets/turnIn.png" />
            </span>
          </b-tab-item>

          <b-tab-item label="Basics">
            In order to interact with something you must click on it. Details
            about items, characters, and doors will appear in the "Inspect" tab
            on the left hand of the screen.
            <img src="./assets/inspect.png" />
            You move to a new area by clicking any exit specified by a white
            square and then click the green arrow. Low ranking Bentham Guard
            members cannot enter private areas.
            <img src="./assets/move.png" />
          </b-tab-item>

          <b-tab-item label="Conversations and Trading">
            You can request a conversation or trade by selecting a character in
            your current room and clicking the dialogue icon. You must be in a
            conversation with someone before you can request to trade with them.
            <br />
            <img src="./assets/startCon.png" align="middle" /> <br />
            You can view any incoming conversation requests from the "Requests"
            tab.
            <img src="./assets/requests.png" />
            Once in a conversation you can turn in quests, tell an Info piece
            that you know, tell the other agent about an item you have, or
            request a trade. You must request a trade to give or receive any
            items or gold. Trade requests work the same way as conversation
            requests.
            <br />
            <img src="./assets/startTrade.png" align="middle" /> <br />
          </b-tab-item>

          <b-tab-item label="Information">
            Every action that occurs in panoptyk is stored as information. You
            can sort information by type, agent, location, and item. Not all
            information types will be able to be filtered by agent and item, for
            example, the MOVE action does not involve any items.
            <img src="./assets/info.png" />
            The "EVENTS" filter is used to filter between actions, questions
            people have asked, and commands that have been given as part of a
            quest.
          </b-tab-item>
        </b-tabs>
      </div>
    </b-modal>
  </div>
</template>

<script lang="ts">
import {
  ClientAPI,
  Agent,
  Room,
  Item,
  Info,
  Quest,
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import Sentence from "../../utils/sentence";
import { UI } from "./../ui";

@Component({
  components: {},
})
export default class HelpWindow extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: false }) showHelp;
  @Prop({ default: {} }) quest: Quest;

  activeTab = 0;

  @Watch("trigger")
  update() {
    this.quest = ClientAPI.playerAgent.activeAssignedQuests[0];
  }

  onClose() {
    this.showHelp = false;
    this.$emit("update:showHelp", this.showHelp);
  }

  get factionLeader() {
    if (ClientAPI.playerAgent.faction) {
      for (const member of ClientAPI.playerAgent.faction.members) {
        if (member !== ClientAPI.playerAgent && member.factionRank >= 1000) {
          return member.agentName;
        }
      }
    }
  }

  get headquarters() {
    if (ClientAPI.playerAgent.faction) {
      return ClientAPI.playerAgent.faction.headquarters.roomName;
    }
  }

  get questText() {
    const txt = [];
    if (!this.quest.id) {
      txt.push({
        type: Sentence.BlockType.NONE,
        text: "You have no active quests. ",
      });
      if (ClientAPI.playerAgent.faction) {
        txt.push({
          type: Sentence.BlockType.NONE,
          text: "Talk to ",
        });
        txt.push({
          type: Sentence.BlockType.AGENT,
          text: this.factionLeader + " ",
        });
        txt.push({
          type: Sentence.BlockType.NONE,
          text: "in ",
        });
        txt.push({
          type: Sentence.BlockType.ROOM,
          text: this.headquarters + " ",
        });
        txt.push({
          type: Sentence.BlockType.NONE,
          text: "to receive a quest.",
        });
      }
    } else {
      const terms = this.quest.task.getTerms();
      txt.push({
        type: Sentence.BlockType.NONE,
        text: "To complete your quest you must ",
      });
      switch (this.quest.type) {
        case "command":
          switch (this.quest.task.action) {
            case Info.ACTIONS.GAVE.name:
              txt.push({
                type: Sentence.BlockType.ACTION,
                text: "Acquire and give ",
              });
              txt.push({
                type: Sentence.BlockType.ITEM,
                text: terms.item + " ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: terms.agent2.agentName + ". ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "Check your Info tab to see the last known action involving the item, " +
                  "but know that it could have been taken by another character. " +
                  "Neutral characters (characters with no faction in the Inspect tab) " +
                  "will tell you if they have any items and will usually be willing to " +
                  "trade it for some gold. ",
              });
              if (ClientAPI.playerAgent.faction.factionType === "criminal") {
                txt.push({
                  type: Sentence.BlockType.NONE,
                  text:
                    "You also have the option to steal the item from someone who is carrying it. " +
                    "You will see the steal icon show up when you click on an agent carrying your quest target. ",
                });
              }
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "After you retrieve the item, turn in the quest to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: this.factionLeader + ". ",
              });
              break;
            case Info.ACTIONS.ARRESTED.name:
              txt.push({
                type: Sentence.BlockType.ACTION,
                text: "Arrest the vile lawbreaker ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: terms.agent2 + ". ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "You can check their last known move in your Info tab, but " +
                  "it is quite possible that they have moved again. " +
                  "You can arrest someone by clicking the handcuffs icon " +
                  "after selecting them."
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "After you arrest the delinquent, turn in the quest to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: this.factionLeader + ". ",
              });
              break;
            case Info.ACTIONS.ASSAULTED.name:
              txt.push({
                type: Sentence.BlockType.ACTION,
                text: "Rough up ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: terms.agent2 + ". ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "You can check their last known move in your Info tab, but " +
                  "it is quite possible that they have moved again. " +
                  "You can assault someone by clicking the bloody knife icon " +
                  "after selecting them."
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "When you are finished, turn in the quest to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: this.factionLeader + ". ",
              });
              break;
            case Info.ACTIONS.THANKED.name:
              txt.push({
                type: Sentence.BlockType.ACTION,
                text: "Thank ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: terms.agent2 + " ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "for aiding our cause. ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "You can check their last known move in your Info tab, but " +
                  "it is quite possible that they have moved again. ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "When you are finished, turn in the quest to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: this.factionLeader + ". ",
              });
              break;
          }
          // generic info gathering quests
          if (!this.quest.task.action && ClientAPI.playerAgent.faction) {
            if (ClientAPI.playerAgent.faction.factionType === "police") {
              txt.push({
                type: Sentence.BlockType.ACTION,
                text: "Report information about ",
              });
              txt.push({
                type: Sentence.BlockType.ILLEGAL,
                text: "illegal ",
              });
              txt.push({
                type: Sentence.BlockType.ITEM,
                text: "items ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "or any illegal activity (such as stealing). ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "Normal citizens will occasionally run up to you " +
                  "and request a conversation to tell you about crimes they " +
                  "have witnessed.",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "When you are finished, turn in the quest to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: this.factionLeader + ". ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "The quest will be marked as completed when you turn-in " +
                  "something about a new item or unpunished crime. ",
              });
            } else if (
              ClientAPI.playerAgent.faction.factionType === "criminal"
            ) {
              txt.push({
                type: Sentence.BlockType.ACTION,
                text: "Gather information about 1 new ",
              });
              txt.push({
                type: Sentence.BlockType.ITEM,
                text: "item ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "that may be worth acquiring. ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text: "When you are finished, turn in the quest to ",
              });
              txt.push({
                type: Sentence.BlockType.AGENT,
                text: this.factionLeader + ". ",
              });
              txt.push({
                type: Sentence.BlockType.NONE,
                text:
                  "The quest will be marked as completed when you turn-in " +
                  "information about an item the leader does not know about. ",
              });
            }
          }
          break;
      }
    }
    return txt;
  }
}
</script>

<style>
#help-card {
  width: 1000px;
}
</style>
