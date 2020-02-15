<template>
  <div class="quest-entry">
      {{status}} <br> {{taskDescription}}
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Quest } from "panoptyk-engine/dist/client";

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
          sentence += " with the mission to find out the unkown parts of Info";
          break;
        case "command":
          sentence += " with the mission of accomplishing the task described in Info";
      }
      sentence += this.quest.task + " and a deadline of " + this.quest.deadline + ".";
      return sentence;
    }
  }
}
</script>

<style>
</style>