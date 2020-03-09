<template>
  <div class="quest-entry">
    {{ status }} <br />
    {{ taskDescription }} <br />
    <span v-for="b in sentence" v-bind:key="b.text" v-bind:class="b.type">
      {{ b.text }}
    </span>
    <span v-if="reason[0]">
      <br />
      because <br />
      <span v-for="b in reason" v-bind:key="b.text" v-bind:class="b.type">
        {{ b.text }}
      </span>
    </span>
    <h2 v-if="rewards[0]">Rewards for completion:</h2>
    <template v-for="row of rewards">
      <div class="info-box" v-bind:key="row">
        <div class="info-text">
          <span v-for="b in row" v-bind:key="b.text" v-bind:class="b.type">
            {{ b.text }}
          </span>
        </div>
      </div>
    </template>
    <h2 v-if="turnedInInfo[0]">Turned-in Info:</h2>
    <template v-for="i of turnedInInfo">
      <div class="info-box" v-bind:key="i.id">
        <div class="info-id">#{{ i.id }}</div>
        <div class="info-text">
          <info-entry v-bind:info="i"></info-entry>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Quest, Info, ClientAPI } from "panoptyk-engine/dist/client";
import Sentence from "../../utils/sentence";
import InfoEntry from "./infoEntry.vue";

@Component({
  components: {
    "info-entry": InfoEntry
  }
})
export default class QuestEntry extends Vue {
  @Prop({ default: {} }) quest: Quest;

  get turnedInInfo() {
    return this.quest.turnedInInfo;
  }

  get reason() {
    if (!this.quest.reasonForQuest) {
      return [];
    }
    const terms = Sentence.replaceMissing(
      this.quest.reasonForQuest.getTerms(),
      "____"
    );
    const reasonTxt = [];
    if (
      this.quest.type === "command" &&
      this.quest.task.action === Info.ACTIONS.ARRESTED.name
    ) {
      switch (this.quest.reasonForQuest.action) {
        case Info.ACTIONS.GAVE.name:
          reasonTxt.push({
            type: Sentence.BlockType.AGENT,
            text: terms.agent1.agentName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ACTION,
            text: "traded an illegal "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ITEM,
            text: terms.item.itemName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.NONE,
            text: "with "
          });
          reasonTxt.push({
            type: Sentence.BlockType.AGENT,
            text: terms.agent2.agentName + " "
          });
          return reasonTxt;
        case Info.ACTIONS.STOLE.name:
          reasonTxt.push({
            type: Sentence.BlockType.AGENT,
            text: terms.agent1.agentName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ACTION,
            text: "stole "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ITEM,
            text: terms.item.itemName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.NONE,
            text: "from "
          });
          reasonTxt.push({
            type: Sentence.BlockType.AGENT,
            text: terms.agent2.agentName + " "
          });
          return reasonTxt;
        case Info.ACTIONS.DROP.name:
          reasonTxt.push({
            type: Sentence.BlockType.AGENT,
            text: terms.agent.agentName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ACTION,
            text: "dropped an illegal "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ITEM,
            text: terms.item.itemName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.NONE,
            text: "in "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ROOM,
            text: terms.loc
          });
          return reasonTxt;
        case Info.ACTIONS.PICKUP.name:
          reasonTxt.push({
            type: Sentence.BlockType.AGENT,
            text: terms.agent.agentName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ACTION,
            text: "grabbed an illegal "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ITEM,
            text: terms.item.itemName + " "
          });
          reasonTxt.push({
            type: Sentence.BlockType.NONE,
            text: "in "
          });
          reasonTxt.push({
            type: Sentence.BlockType.ROOM,
            text: terms.loc
          });
          return reasonTxt;
      }
    }
    return Sentence.fromInfo(this.quest.reasonForQuest);
  }

  generateRewardTxt(reward: Info) {
    const terms = reward.getTerms();
    const rewardTxt = [];
    switch (reward.action) {
      case Info.ACTIONS.PAID.name:
        rewardTxt.push({
          type: Sentence.BlockType.ITEM,
          text: terms.quantity + " gold "
        });
        break;
      case Info.ACTIONS.GAVE.name:
        rewardTxt.push({
          type: Sentence.BlockType.ITEM,
          text: terms.item.itemName
        });
        break;
      case Info.ACTIONS.PROMOTE.name:
        rewardTxt.push({
          type: Sentence.BlockType.FACTION,
          text: "Advancement to next rank "
        });
        break;
    }
    return rewardTxt;
  }

  get rewards() {
    const rewardTxt = [];
    for (const reward of this.quest.offeredRewards) {
      rewardTxt.push(this.generateRewardTxt(reward));
    }
    return rewardTxt;
  }

  get status() {
    if (this.quest) {
      return "Status: " + this.quest.status + "\n";
    }
  }

  get taskDescription() {
    if (this.quest) {
      let sentence = "Quest assigned by " + this.quest.giver;
      switch (this.quest.type) {
        case "question":
          sentence += " with the mission to resolve the following mystery: ";
          break;
        case "command":
          sentence += " with the mission of accomplishing the following task: ";
      }
      return sentence;
    }
  }
  get sentence() {
    const terms = Sentence.replaceMissing(this.quest.task.getTerms(), "any");
    const taskTxt = [];
    switch (this.quest.type) {
      case "command":
        switch (this.quest.task.action) {
          case Info.ACTIONS.GAVE.name:
            taskTxt.push({
              type: Sentence.BlockType.ACTION,
              text: "Acquire and give "
            });
            taskTxt.push({
              type: Sentence.BlockType.ITEM,
              text: terms.item + " "
            });
            taskTxt.push({
              type: Sentence.BlockType.NONE,
              text: "to "
            });
            taskTxt.push({
              type: Sentence.BlockType.AGENT,
              text: terms.agent2.agentName + " "
            });
            return taskTxt;
          case Info.ACTIONS.DROP.name:
            taskTxt.push({
              type: Sentence.BlockType.ACTION,
              text: "Drop "
            });
            taskTxt.push({
              type: Sentence.BlockType.ITEM,
              text: terms.item + " "
            });
            taskTxt.push({
              type: Sentence.BlockType.NONE,
              text: "in "
            });
            taskTxt.push({
              type: Sentence.BlockType.ROOM,
              text: terms.loc
            });
            return taskTxt;
          case Info.ACTIONS.TOLD.name:
            taskTxt.push({
              type: Sentence.BlockType.ACTION,
              text: "Tell "
            });
            taskTxt.push({
              type: Sentence.BlockType.AGENT,
              text: terms.agent2 + " "
            });
            taskTxt.push({
              type: Sentence.BlockType.NONE,
              text: "about "
            });
            taskTxt.push({
              type: Sentence.BlockType.INFO,
              text: terms.info
            });
            return taskTxt;
          case Info.ACTIONS.CONVERSE.name:
            const targetAgent =
              terms.agent1 === ClientAPI.playerAgent
                ? terms.agent2
                : terms.agent1;

            taskTxt.push({
              type: Sentence.BlockType.ACTION,
              text: "Have a conversation with "
            });
            taskTxt.push({
              type: Sentence.BlockType.AGENT,
              text: terms.agent2 + " "
            });
            return taskTxt;
        }
    }
    return Sentence.fromInfo(this.quest.task);
  }
}
</script>

<style></style>
