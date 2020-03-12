<template>
  <div id="trade-tab" class="game-tab" v-if="inTrade">
    <div class="content" id="trade-info">
      You are in a trade with
      <span class="agent">{{ otherAgent.agentName }}</span
      >.
      <b-button size="is-small" @click="leaveTrade">Leave</b-button>
    </div>
    <b-collapse class="card" aria-id="trade-controls">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="trade-controls"
      >
        <p class="card-header-title">Offer/Request in trade</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <b-field class="no-margin" label="Gold" grouped>
            <b-numberinput
              id="gold-input"
              class="trade-left"
              size="is-small"
              min="0"
              v-model="gold"
              controls-position="compact"
              controls-rounded              
            >
            </b-numberinput>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onOfferGold"
                >Offer</b-button
              >
              <b-button class="button" size="is-small" @click="onReqGold"
                >Request</b-button
              >
            </div>
          </b-field>

          <b-field class="no-margin" label="Item" grouped>
            <span class="trade-text" style="margin-left: auto;"> I: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="item"
            >
              <option disabled value>--ID--</option>
              <option
                v-for="i in items"
                v-bind:key="i.id"
                v-bind:value="i"
                >{{ i.id }}</option
              >
            </b-select>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onOfferItem"
                >Offer</b-button
              >
              <b-button class="button" size="is-small" @click="onReqItem"
                >Request</b-button
              >
            </div>
          </b-field>

          <b-field class="no-margin" label="Answer" grouped>
            <span class="trade-text" style="margin-left: .5rem;"> Q: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="question"
            >
              <option disabled value>--ID--</option>
              <option
                v-for="q in questions"
                v-bind:key="q.id"
                v-bind:value="q"
                >{{ q.id }}</option
              >
            </b-select>
            <span class="trade-text"> A: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="answer"
            >
              <option disabled value>--ID--</option>
              <option
                v-for="i in knowledge"
                v-bind:key="i.id"
                v-bind:value="i"
                >{{ i.id }}</option
              >
            </b-select>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onOfferAnswer"
                >Offer</b-button
              >
              <b-button class="button" size="is-small" @click="onReqAnswer"
                >Request</b-button
              >
            </div>
          </b-field>
        </div>
      </div>
      <footer class="card-footer" v-if="!otherReady">
        <b-switch class="card-footer-item" v-model="indicateReady" @input="sendReady">
          {{ ready(indicateReady) }}
        </b-switch>
      </footer>
      <footer class="card-footer" v-else>
        <b-switch class="card-footer-item" v-model="indicateReady" @input="sendReady">
          Complete Trade
        </b-switch>
      </footer>
    </b-collapse>

    <b-collapse class="card" aria-id="your-offer">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="your-offer"
      >
        <p class="card-header-title">Your offer ({{ ready(myReady) }})</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div> Gold: {{ myGoldOffer }} </div>
          <div> Items: <span v-for="i in myItemOffers" v-bind:key="i.id">{{ i.itemName }}, </span></div>
          <div> Answers </div>
          <div v-for="a in myAnswerOffers" v-bind:key="a.qID">One answer to question({{ a.qID }}) <span v-if="a.masked"> masked.</span> <span v-else> not masked.</span> </div>
        </div>
      </div>
    </b-collapse>

    <b-collapse class="card" aria-id="other-offer">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="other-offer"
      >
        <p class="card-header-title">{{ otherAgent.agentName }}'s offer ({{ ready(otherReady) }})</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div> Gold: {{ otherGoldOffer }} </div>
          <div> Items: <span v-for="i in otherItemOffers" v-bind:key="i.id">{{ i.itemName }}, </span></div>
          <div> Answers </div>
          <div v-for="a in otherAnswerOffers" v-bind:key="a.qID">One answer to question({{ a.qID }}) <span v-if="a.masked"> masked.</span> <span v-else> not masked.</span> </div>
        </div>
      </div>
    </b-collapse>
  </div>
  <!-- Below is for if agent is not in a trade -->
  <div id="trade-tab" class="game-tab" style="text-align: center;" v-else>
    you are not in a trade...
  </div>
</template>

<script lang="ts">
import { ClientAPI, Agent, Item, Info } from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class TradeTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: [] }) items: Item[];
  @Prop({ default: [] }) knowledge: Info[];
  // Toggle what to display depending on if in a trade
  inTrade = false;
  @Watch("trigger")
  updateInTrade() {
    this.inTrade = ClientAPI.playerAgent
       ? ClientAPI.playerAgent.trade !== undefined
       : false;
  }
  leaveTrade() {
    ClientAPI.cancelTrade();
  }

  otherAgent: Agent;
  myReady: boolean;
  otherReady: boolean;
  myGoldOffer: number;
  otherGoldOffer: number;
  myItemOffers: Item[];
  otherItemOffers: Item[];
  myAnswerOffers;
  otherAnswerOffers;
  @Watch("trigger")
  updateTrade() {
    if (!this.inTrade) {
      return;
    }
    const trade = ClientAPI.playerAgent.trade;
    const player = ClientAPI.playerAgent;
    this.otherAgent = trade.conversation.getAgents(
      ClientAPI.playerAgent
    )[0];
    // Get ready status
    this.myReady = trade.getAgentReadyStatus(player);
    this.indicateReady = this.myReady;
    this.otherReady = trade.getAgentReadyStatus(this.otherAgent);
    // Get gold offers
    this.myGoldOffer = trade.getAgentsOfferedGold(player);
    this.otherGoldOffer = trade.getAgentsOfferedGold(this.otherAgent);
    // Get item offers
    this.myItemOffers = trade.getAgentItemsData(player);
    this.otherItemOffers = trade.getAgentItemsData(this.otherAgent);
    // Get answer offers
    this.myAnswerOffers = trade.getAnswersOffered(player);
    this.otherAnswerOffers = trade.getAnswersOffered(this.otherAgent);
  }
  // Indicator for if player is ready
  indicateReady = false;
  ready(ready) {
    return ready ? "ready" : "not ready";
  }
  sendReady() {
    ClientAPI.setTradeReadyStatus(this.indicateReady);
  }

  // trade controls tab
  questions: Info[] = [];
  @Watch("knowledge") 
  updateQuestions() {
    this.questions = ClientAPI.playerAgent.getInfoByAction(Info.ACTIONS.ASK.name).filter(i => !i.isQuery()).map(i => i.getTerms().info);
  }
  gold: number;
  item: Item;
  question: Info;
  answer: Info;

  onOfferGold() {
    ClientAPI.addGoldToTrade(this.gold - this.myGoldOffer);
  }
  onReqGold() {
    console.log("Not Implemented!");
  }
  onOfferItem() {
    ClientAPI.offerItemsTrade([this.item]);
  }
  onReqItem() {
    ClientAPI.requestItemTrade(this.item);
  }
  onOfferAnswer() {
    ClientAPI.offerAnswerTrade(this.answer, this.question);
  }
  onReqAnswer() {
    console.log("Not Implemented!");
  }
}
</script>

<style>
#gold-input {
  width: 100px;
}
.control.trade-select {
  margin: auto;
  margin-left: 0.2rem;
  margin-top: 0px;
}

.trade-left {
  margin: auto;
}
.trade-right {
  margin-left: auto;
  margin-right: 0;
}
.field:not(:last-child).no-margin {
  margin-bottom: 0;
}
.label {
  margin-bottom: 0.25rem;
}
</style>
