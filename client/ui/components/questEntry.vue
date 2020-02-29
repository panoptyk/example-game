<template>
  <div class="quest-entry">
    {{ status }} <br />
    {{ taskDescription }} <br />
    <span v-for="b in sentence" v-bind:key="b.text" v-bind:class="b.type">
      {{ b.text }}
    </span>
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

@Component({})
export default class QuestEntry extends Vue {
  @Prop({ default: {} }) quest: Quest;

  get turnedInInfo() {
    return this.quest.turnedInInfo;
  }

  get status() {
    if (this.quest) {
      return "Status: " + this.quest.status + "\n";
    }
  }

  get taskDescription() {
    if (this.quest) {
      let sentence =
        "Description: " +
        this.quest.type +
        " quest assigned by " +
        this.quest.giver;
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
    const terms = this.quest.task.getTerms();
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
