<template>
  <div class="quest-entry">
      {{status}} <br> {{taskDescription}} <br>
      <span v-for="b in sentence" v-bind:key="b.text" v-bind:class="b.type">
        {{ b.text }}
      </span>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Quest } from "panoptyk-engine/dist/client";
import Sentence from "../../utils/sentence";

@Component({
  
})
export default class QuestEntry extends Vue {
  @Prop({ default: {} }) quest: Quest;
  get status() {
    if(this.quest) {
      return "Status: " + this.quest.status + "\n";
    }
  }
  get taskDescription() {
    if (this.quest) {
      let sentence = "Description: " + this.quest.type + " quest assigned by " + this.quest.giver;
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
    return Sentence.fromInfo(this.quest.task);
  }
}
</script>

<style>
</style>