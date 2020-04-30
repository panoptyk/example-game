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

          <b-field class="no-margin" label="ItemOffer" grouped>
            <span class="trade-text" style="margin-left: auto;"> I: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="itemO"
            >
              <option disabled value>--ID--</option>
              <option
                v-for="i in posessItems"
                v-bind:key="i.id"
                v-bind:value="i"
                >{{ i.itemName + "#" + i.id }}</option
              >
            </b-select>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onOfferItem"
                >Offer</b-button
              >
            </div>
          </b-field>

          <b-field class="no-margin" label="ItemRequest" grouped>
            <span class="trade-text" style="margin-left: auto;"> I: </span>
            <b-select
              placeholder="--ID--"
              size="is-small"
              class="trade-select"
              v-model="itemR"
            >
              <option disabled value>--ID--</option>
              <option
                v-for="i in masterItems"
                v-bind:key="i.id"
                v-bind:value="i"
                >{{ i.itemName }}</option
              >
            </b-select>

            <div class="trade-right">
              <b-button class="button" size="is-small" @click="onReqItem"
                >Request</b-button
              >
            </div>
          </b-field>

          <b-field class="no-margin" label="Answer" grouped>
            <span class="trade-text" style="margin-left: .5rem;"> Q: </span>
            <b-tooltip
              v-bind:label="sentenceStr(question)"
              position="is-top"
              multilined
              :delay="50"
            >
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
                  >{{ getType(q) }}#{{ q.id }}</option
                >
              </b-select>
            </b-tooltip>

            <span class="trade-text"> A: </span>
            <b-tooltip
              v-bind:label="sentenceStr(answer)"
              position="is-top"
              multilined
              :delay="50"
            >
              <b-select
                placeholder="--ID--"
                size="is-small"
                class="trade-select"
                v-model="answer"
              >
                <option disabled value>--ID--</option>
                <option v-for="i in answers" v-bind:key="i.id" v-bind:value="i"
                  >{{ getType(i) }}#{{ i.id }}</option
                >
              </b-select>
            </b-tooltip>

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
          <div>Gold: {{ myGoldOffer }}</div>
          <div>
            Items:
            <span v-for="i in myItemOffers" v-bind:key="i.id"
              >{{ i.itemName }},
            </span>
          </div>
          <div>Answers</div>
          <div v-for="a in myAnswerOffers" v-bind:key="a.qID">
            {{ a.quantity }} answer(s) to question#{{ a.qID }}.
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
              >{{ i.itemName }},
            </span>
          </div>
          <div>Answers</div>
          <div v-for="a in otherAnswerOffers" v-bind:key="a.qID">
            {{ a.quantity }} answer(s) to question#{{ a.qID }}.
          </div>
        </div>
      </div>
    </b-collapse>

    <b-collapse class="card" aria-id="requests">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="other-offer"
      >
        <p class="card-header-title">Requested items and answers</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div v-for="req in displayRequests" v-bind:key="getKey(req)">
            <span v-if="req.model.constructor.name === 'Item'">
              {{ aName(req.agent) }} has asked for {{ req.model.itemName }}.
              {{ req.pass ? "Passed" : "" }}
              <b-button
                v-if="!req.pass && aName(req.agent) !== 'You'"
                @click="onPass(req.model)()"
                size="is-small"
                type="is-danger"
                outlined
                class="request-button"
                >Pass</b-button
              >
            </span>
            <span v-else>
              {{ aName(req.agent) }} has asked for answers to question#{{
                req.model.id
              }}.
              {{ req.pass ? "Passed" : "" }}
              <b-button
                v-if="!req.pass && aName(req.agent) !== 'You'"
                @click="onPass(req.model)()"
                size="is-small"
                type="is-danger"
                outlined
                class="request-button"
                >Pass</b-button
              >
            </span>
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
import Sentence from "../../utils/sentence";
import { ClientAPI, Agent, Item, Info } from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class TradeTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: [] }) items: Item[];
  @Prop({ default: [] }) knowledge: Info[];

  leaveTrade() {
    ClientAPI.cancelTrade();
  }

  get posessItems() {
    return this.items.filter(
      (i) => (i.agent ? i.agent.id : 0) === ClientAPI.playerAgent.id
    );
  }

  get masterItems() {
    return this.items.filter((i) => i.isMaster());
  }

  aName(agent: Agent): string {
    if (agent.id === ClientAPI.playerAgent.id) {
      return "You";
    }
    return agent.agentName;
  }

  getKey(req: any) {
    const key = req.agent.agentName + req.model.toString() + req.pass;
    return key;
  }

  inTrade = false;
  otherAgent: Agent;
  myReady: boolean;
  otherReady: boolean;
  myGoldOffer: number;
  otherGoldOffer: number;
  myItemOffers: Item[];
  otherItemOffers: Item[];
  myAnswerOffers;
  otherAnswerOffers;
  requests: Map<any, number> = new Map();
  displayRequests: { model: any; agent: Agent; pass: boolean }[] = [];
  @Watch("trigger")
  updateTrade() {
    this.inTrade = ClientAPI.playerAgent
      ? ClientAPI.playerAgent.trade !== undefined
      : false;
    if (!this.inTrade) {
      this.requests = new Map();
      this.displayRequests = [];
      return;
    }
    const trade = ClientAPI.playerAgent.trade;
    const player = ClientAPI.playerAgent;
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
    this.myAnswerOffers = trade.getAnswersOffered(player);
    this.otherAnswerOffers = trade.getAnswersOffered(this.otherAgent);

    // figure out requests
    const processReq = (agent: Agent) => {
      return (pass, model) => {
        let index = this.displayRequests.findIndex((val) => {
          return val.model.id === model.id && val.agent.id === agent.id;
        });
        const obj = {
          model,
          agent,
          pass,
        };
        if (index !== -1) {
          this.displayRequests[index] = obj;
        } else {
          index = this.displayRequests.length;
          this.displayRequests.push(obj);
        }
        const now = Date.now();
        if (pass && this.requests.has(model)) {
          if (now - this.requests.get(model) >= 5000) {
            this.displayRequests.splice(index, 1);
          }
        } else if (pass) {
          this.requests.set(model, now);
        }
      };
    };
    trade.getAgentsRequestedItems(player).forEach(processReq(player));
    trade
      .getAgentsRequestedItems(this.otherAgent)
      .forEach(processReq(this.otherAgent));
    trade.getAgentsRequestedAnswers(player).forEach(processReq(player));
    trade
      .getAgentsRequestedAnswers(this.otherAgent)
      .forEach(processReq(this.otherAgent));
  }
  // Indicator for if player is ready
  indicateReady = false;
  ready(ready) {
    return ready ? "ready" : "not ready";
  }
  sendReady() {
    ClientAPI.setTradeReadyStatus(this.indicateReady);
  }

  // Style
  getType(i: Info) {
    if (i.isQuery()) {
      return "Question";
    } else if (i.isCommand()) {
      return "Command";
    } else {
      return "Info";
    }
  }

  sentenceStr(info: Info): string {
    const sentence = (info != undefined && info.id >= 0) ? Sentence.fromInfo(info) : [];
    const temp = sentence.reduce((a, b) => a + b.text, "");
    return temp;
  }

  // trade controls tab
  questions: Info[] = [];
  @Watch("knowledge")
  updateQuestions() {
    this.questions = ClientAPI.playerAgent
      .getInfoByAction(Info.ACTIONS.ASK.name)
      .filter((i) => !i.isQuery())
      .map((i) => i.getTerms().info);
  }
  gold: number;
  itemO: Item;
  itemR: Item;
  question: Info = {} as any;
  answers: Info[] = [];
  answer: Info = {} as any;

  @Watch("question")
  updateAnswers() {
    if (this.question == undefined || this.question.id <= 0) {
      this.answers = [];
    }

    if (this.question.getTerms().action !== undefined) {
      this.answers = ClientAPI.playerAgent.getInfoByAction(
        this.question.getTerms().action
      );
    } else {
      this.answers = this.knowledge;
    }
    this.answers = this.answers.filter((ans) => ans.isAnswer(this.question));
  }

  onOfferGold() {
    ClientAPI.addGoldToTrade(this.gold - this.myGoldOffer);
  }
  onReqGold() {
    console.log("Not Implemented!");
  }
  onOfferItem() {
    ClientAPI.offerItemsTrade([this.itemO]);
  }
  onReqItem() {
    ClientAPI.requestItemTrade(this.itemR);
  }
  onOfferAnswer() {
    ClientAPI.offerAnswerTrade(this.answer, this.question);
  }
  onReqAnswer() {
    ClientAPI.requestAnswerTrade(this.question);
  }
  onPass(model: any) {
    if (model instanceof Item) {
      return function() {
        ClientAPI.passItemRequestTrade(model);
      };
    } else if (model instanceof Info) {
      return function() {
        ClientAPI.passInfoRequestTrade(model);
      };
    }
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
