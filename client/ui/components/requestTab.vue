<template>
  <div id="request-tab" class="game-tab">
    <request 
        v-for="(agent, index) in this.conversationRequests"
        v-bind:key="agent.id"
        v-bind:index="index"
        v-bind:agent="agent"
        v-bind:trade="false"
    ></request>
    <request 
        v-for="(agent, index) in this.tradeRequests"
        v-bind:key="agent.id"
        v-bind:index="index"
        v-bind:agent="agent"
        v-bind:trade="true"
    ></request>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { ClientAPI } from "panoptyk-engine/dist/client";
import request from "./request.vue";
import { UI } from "./../ui";

@Component({
  components: {
    request: request
  }
})
export default class RequestTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  conversationRequests = [];
  tradeRequests = [];

  @Watch("trigger")
  onUpdate() {
    if (ClientAPI.playerAgent) {
      this.conversationRequests = ClientAPI.playerAgent.conversationRequesters;
      this.tradeRequests = ClientAPI.playerAgent.tradeRequesters;
      UI.instance.main.$data.requestsTally = this.conversationRequests.length + this.tradeRequests.length;
    }
  }
}
</script>

<style></style>
