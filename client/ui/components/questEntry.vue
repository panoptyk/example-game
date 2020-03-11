<template>
  <div class="quest-entry">
    <b>{{ title }}</b> <br />
    {{ status }} Reward: <i>{{ quest.rewardXP }}xp</i> <br />
    <span v-for="b of taskDescription" v-bind:key="b.text" v-bind:class="b.type"> {{ b.text }} </span>
    <template v-if="quest.type !== 'item'">
      <div v-for="i of turnedInInfo" class="info-box" v-bind:key="i.id">
        <div class="info-id">#{{ i.id }}</div>
        <div class="info-text">
          <info-entry v-bind:info="i"></info-entry>
        </div>
      </div>
    </template>
    <template v-else>
      <div v-for="i of turnedInItem" class="item-box" v-bind:key="i.id">
        <div class="item-id">#{{ i.id }}</div>
        <div class="item-text">
          <item-entry v-bind:item="i"></item-entry>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Quest, Info, ClientAPI } from "panoptyk-engine/dist/client";
import Sentence from "../../utils/sentence";

@Component({})
export default class QuestEntry extends Vue {
  @Prop({ default: {} }) quest: Quest;

  get turnedInInfo() {
    return this.quest.turnedInInfo;
  }

  get turnedInItem() {
    return this.quest.turnedInItems;
  }

  get title() {
    if (this.quest) {
      if (this.quest.type === "question") {
        "Gather Info";
      } else if (this.quest.type === "item") {
        return "Fetch Item";
      } else {
        return "QUEST";
      }
    }
  }

  get status() {
    if (this.quest) {
      return "Status: " + this.quest.status + "\n";
    }
  }

  get taskDescription() {
    const blocks: Sentence.Block[] = [];
    if (this.quest) {
      blocks.push({
        text: this.quest.giver.agentName,
        type: Sentence.BlockType.AGENT
      });
      switch (this.quest.type) {
        case "question":
          blocks.push({
            text: " asks you to gather " + this.quest.amount + " answer(s) to the following question: ",
            type: Sentence.BlockType.NONE
          });
          break;
        case "command":
          blocks.push({
            text: " not implemented ",
            type: Sentence.BlockType.NONE
          });
          break;
        case "item":
          blocks.push({
            text: " asks you to fetch " + this.quest.amount + " ",
            type: Sentence.BlockType.NONE
          });
          blocks.push({
            text: this.quest.item.itemName + "(s)",
            type: Sentence.BlockType.ITEM
          });
          break;
      }
      return blocks;
    }
  }
}
</script>

<style></style>
