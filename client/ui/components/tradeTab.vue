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

          <b-field class="no-margin" label="Your Items" grouped>
            <span class="trade-text" style="margin-left: auto;"> I: </span>
            <b-select
              placeholder="--Item Name--"
              size="is-small"
              class="trade-select"
              v-model="offItem"
            >
              <option disabled value>--Item Name--</option>
              <option
                v-for="i in inventory"
                v-bind:key="i.id"
                v-bind:value="i"
                >{{ getItemName(i) }}</option
              >
            </b-select>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onOfferItem"
                >Offer</b-button
              >
            </div>
          </b-field>

          <b-field class="no-margin" label="All Items" grouped>
            <span class="trade-text" style="margin-left: auto;"> I: </span>
            <b-select
              placeholder="--Item Name--"
              size="is-small"
              class="trade-select"
              v-model="reqItem"
            >
              <option disabled value>--Item Name--</option>
              <option v-for="i in items" v-bind:key="i.id" v-bind:value="i">{{
                getItemName(i)
              }}</option>
            </b-select>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onReqItem"
                >Request</b-button
              >
            </div>
          </b-field>

          <b-field class="no-margin" label="Offer an Answer" grouped>
            <span class="trade-text" style="margin-left: .5rem;"> Q: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="question"
              @input="onQuestionSelect"
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
                v-for="i in validAnswers"
                v-bind:key="i.id"
                v-bind:value="i"
                >{{ i.id }}</option
              >
            </b-select>
            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onOfferAnswer"
                >Offer</b-button
              >
            </div>
          </b-field>
          <b-field class="no-margin" label="Request an Answer" grouped>
            <span class="trade-text" style="margin-left: .5rem;"> Q: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="toAsk"
            >
              <option disabled value>--ID--</option>
              <option
                v-for="q in questions"
                v-bind:key="q.id"
                v-bind:value="q"
                >{{ q.id }}</option
              >
            </b-select>
            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onReqAnswer"
                >Request</b-button
              >
            </div>
          </b-field>
        </div>
      </div>
      <footer class="card-footer" v-if="!otherReady">
        <b-switch
          class="card-footer-item"
          v-model="indicateReady"
          @input="sendReady"
        >
          {{ ready(indicateReady) }}
        </b-switch>
      </footer>
      <footer class="card-footer" v-else>
        <b-switch
          class="card-footer-item"
          v-model="indicateReady"
          @input="sendReady"
        >
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
          <div>
            Gold: {{ myGoldOffer }}
            <b-button
              class="button"
              v-if="myGoldOffer"
              size="is-small"
              @click="onRemoveAllOfferedGold()"
              >Remove</b-button
            >
          </div>
          <div>
            Items:
            <span v-for="i in myItemOffers" v-bind:key="i.id"
              >{{ getItemName(i) }}
              <b-button class="button" size="is-small" @click="onRemoveItem(i)"
                >Remove</b-button
              >,
            </span>
          </div>
          <div>
            Answers:
            <div
              v-for="answerObj in myAnswerOffers"
              v-bind:key="answerObj.answerID"
            >
              Info#{{ answerObj.answerID }}
              <b-button
                class="button"
                size="is-small"
                @click="onRemoveAnswer(answerObj.answerID)"
                >Remove</b-button
              >
            </div>
          </div>
        </div>
      </div>
    </b-collapse>

    <b-collapse class="card" aria-id="your-requests">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="your-requests"
      >
        <p class="card-header-title">Your requests</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div>
            Gold: {{ myGoldRequest }}
            <b-button
              class="button"
              v-if="myGoldRequest"
              size="is-small"
              @click="onRemoveAllRequestedGold()"
              >Remove</b-button
            >
          </div>
          <div>
            Items:
            <span v-for="row in myItemRequests" v-bind:key="row[0].id"
              >{{ getItemName(row[0]) }}
              <span v-if="row[1]">(Refused)</span>
              <b-button
                class="button"
                size="is-small"
                @click="onRemoveItemRequest(row[0])"
                >Remove</b-button
              >,
            </span>
          </div>
          <div>
            Answers:
            <div v-for="row in myAnswerRequests" v-bind:key="row[0].id">
              Answer(s) to Question#{{ row[0].id }}
              <span v-if="row[1]">(Refused)</span>
              <b-button
                class="button"
                size="is-small"
                @click="onRemoveAnswerRequest(row[0])"
                >Remove</b-button
              >
            </div>
          </div>
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
        <p class="card-header-title">
          {{ otherAgent.agentName }}'s offer ({{ ready(otherReady) }})
        </p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div>Gold: {{ otherGoldOffer }}</div>
          <div>
            Items:
            <span v-for="i in otherItemOffers" v-bind:key="i.id"
              >{{ getItemName(i) }},
            </span>
          </div>
          <div>
            Answers:
            <div v-for="a in otherAnswerOffers" v-bind:key="a.qID">
              <div v-if="a.quantity > 0">
                {{ a.quantity }} answer(s) to Question#{{ a.qID }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </b-collapse>

    <b-collapse class="card" aria-id="other-requests">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="your-requests"
      >
        <p class="card-header-title">{{ otherAgent.agentName }}'s requests</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div>Gold: {{ otherGoldRequest }}</div>
          <div>
            Items:
            <span v-for="row in otherItemRequests" v-bind:key="row[0].id"
              >{{ getItemName(row[0]) }}
              <b-button
                class="button"
                v-if="!row[1]"
                size="is-small"
                @click="onRejectItem(row[0])"
                >Reject</b-button
              >
              <span v-if="row[1]">(Refused)</span>,
            </span>
          </div>
          <div>
            Answers:
            <div v-for="row in otherAnswerRequests" v-bind:key="row[0].id"
              >Answer(s) to Question#{{ row[0].id }}
              <b-button
                class="button"
                v-if="!row[1]"
                size="is-small"
                @click="onRejectAnswerReq(row[0])"
                >Reject</b-button
              >
              <span v-if="row[1]">(Refused)</span>
            </div>
          </div>
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
import { UI } from "../ui";

@Component({})
export default class TradeTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: [] }) items: Item[];
  @Prop({ default: [] }) inventory: Item[];
  @Prop({ default: [] }) knowledge: Info[];
  @Prop({ default: [] }) questions: Info[];
  @Prop({ default: [] }) validAnswers: Info[];
  @Prop({ default: undefined }) question: Info;
  @Prop({ default: undefined }) answer: Info;
  @Prop({ default: undefined }) toAsk: Info;

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
  myGoldRequest: number;
  otherGoldRequest: number;
  myItemRequests;
  otherItemRequests;
  myAnswerRequests;
  otherAnswerRequests;
  gold: number;
  offItem: Item;
  reqItem: Item;

  @Watch("trigger")
  updateTrade() {
    if (!this.inTrade) {
      return;
    }
    const trade = ClientAPI.playerAgent.trade;
    const player = ClientAPI.playerAgent;
    this.inventory = player.inventory;
    this.otherAgent = trade.conversation.getAgents(ClientAPI.playerAgent)[0];
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
    this.myAnswerOffers = trade.getAgentsAnswers(player);
    this.otherAnswerOffers = trade.getAnswersOffered(this.otherAgent);
    // Get gold requests
    this.myGoldRequest = trade.getAgentsRequestedGold(player);
    this.otherGoldRequest = trade.getAgentsRequestedGold(this.otherAgent);
    // Get item requests
    this.myItemRequests = trade.getAgentsRequestedItems(player);
    this.otherItemRequests = trade.getAgentsRequestedItems(this.otherAgent);
    // Get answer requests
    this.myAnswerRequests = trade.getAgentsRequestedAnswers(player);
    this.otherAnswerRequests = trade.getAgentsRequestedAnswers(this.otherAgent);
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
  @Watch("knowledge")
  updateQuestions() {
    this.questions = ClientAPI.playerAgent
      .getInfoByAction(Info.ACTIONS.ASK.name)
      .map((i) => {
        const terms = i.getTerms();
        return terms.info ? terms.info : i;
      });
    this.onQuestionSelect();
  }

  onQuestionSelect() {
    this.validAnswers = [];
    if (this.question) {
      console.log(this.question.getTerms());
      for (const info of ClientAPI.playerAgent.knowledge) {
        if (
          !info.isQuery() &&
          !info.isCommand() &&
          info.isAnswer(this.question)
        ) {
          this.validAnswers.push(info);
        }
      }
    }
  }

  onOfferGold() {
    ClientAPI.addGoldToTrade(this.gold - this.myGoldOffer).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRemoveAllOfferedGold() {
    ClientAPI.removeGoldfromTrade(this.gold).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRemoveAllRequestedGold() {
    ClientAPI.requestGoldTrade(0).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onReqGold() {
    ClientAPI.requestGoldTrade(this.gold).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onOfferItem() {
    ClientAPI.offerItemsTrade([this.offItem]).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onReqItem() {
    ClientAPI.requestItemTrade(this.reqItem).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onOfferAnswer() {
    ClientAPI.offerAnswerTrade(this.answer, this.question).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRejectAnswerReq(info: Info) {
    ClientAPI.passInfoRequestTrade(info).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRemoveAnswerRequest(info: Info) {
    ClientAPI.removeInfoRequestTrade(info).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRemoveAnswer(infoID: number) {
    ClientAPI.withdrawInfoTrade(Info.getByID(infoID)).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onReqAnswer() {
    ClientAPI.requestAnswerTrade(this.toAsk).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRejectItem(item: Item) {
    ClientAPI.passItemRequestTrade(item).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRemoveItem(item: Item) {
    ClientAPI.withdrawItemsTrade([item]).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }
  onRemoveItemRequest(item: Item) {
    ClientAPI.removeItemRequest(item).then(
      (res) => {},
      (err) => {
        UI.instance.addError(err.message);
      }
    );
  }

  getItemName(i: Item) {
    let txt = "";
    if (i.itemTags && i.itemTags.has("illegal")) {
      txt += "illegal ";
    }
    txt += i.itemName;
    return txt;
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
