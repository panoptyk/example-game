<template>
  <b-notification
    class="request-entry"
    style="margin-bottom: 5px;"
    :closable="false"
  >
    <span class="agent">{{ this.agent.agentName }}</span> has requested a
    {{ this.requestType }}.
    <b-button
      @click="onAccept"
      size="is-small"
      type="is-success"
      outlined
      class="request-button"
      >Accept</b-button
    >
    <b-button
      @click="onDecline"
      size="is-small"
      type="is-danger"
      outlined
      class="request-button"
      >Decline</b-button
    >
  </b-notification>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { UI } from "../ui";
import { Agent, ClientAPI } from "panoptyk-engine/dist/client";

@Component({})
export default class Request extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: false }) trade: boolean;
  @Prop({ default: undefined }) agent: Agent;

  get requestType() {
    return this.trade ? "trade" : "conversation";
  }

  onAccept() {
    if (this.trade) {
      ClientAPI.acceptTrade(this.agent);
      UI.instance.setRightTab(UI.RTABS.TRADE);
    } else {
      ClientAPI.acceptConversation(this.agent);
      UI.instance.setRightTab(UI.RTABS.CONVERSATION);
    }
  }

  onDecline() {
    if (this.trade) {
      ClientAPI.rejectTrade(this.agent);
    } else {
      ClientAPI.rejectConversation(this.agent);
    }
  }
}
</script>

<style>
.request-button {
  float: right;
  padding: 5px;
}
.request-entry {
    color: black;
}
</style>
