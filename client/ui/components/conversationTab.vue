<template>
  <div id="conversation-tab" class="game-tab" v-if="inConvo">
    <div class="content" id="conversation-info">
      You are in a conversation with
      <span class="agent">{{ otherAgentName }}</span
      >.
      <b-button size="is-small" @click="leaveConvo">Leave</b-button>
    </div>
    <b-collapse class="card" aria-id="ask-question">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="ask-question"
      >
        <p class="card-header-title">Ask a question</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <b-field type="is-action">
            <b-select
              placeholder="-- action --"
              size="is-small"
              v-model="actionSelected"
            >
              <option disabled value>-- action --</option>
              <option
                v-for="act in defaultActions"
                v-bind:key="act"
                v-bind:value="act"
                >{{ act }}</option
              >
            </b-select>
          </b-field>
          <b-field
            v-for="field in questionFields"
            v-bind:key="field + actionSelected"
          >
            <!--<b-input v-if="field === 'time'" type="number" size="is-small" placeholder="0,00" style= "width: 72px;"></b-input>-->
            <b-select
              v-if="field !== 'time' && field !== 'quantity'"
              v-bind:placeholder="'-- ' + field + ' --'"
              size="is-small"
              v-model="questionInfo[field]"
              @input="infoEntryData"
            >
              <option disabled value>-- {{ field }} --</option>
              <option v-bind:value="0">???</option>
              <option
                v-for="item in getFieldItems(field)"
                v-bind:key="item"
                v-bind:value="item.id"
                >{{ item.name }}</option
              >
            </b-select>
          </b-field>
          <info-entry v-bind:info="questionData"></info-entry>
        </div>
      </div>
      <footer class="card-footer">
        <a class="card-footer-item" @click="onAsk">Ask</a>
      </footer>
    </b-collapse>
    <b-collapse class="card" aria-id="tell-info" v-bind:key="trigger">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="tell-info"
      >
        <p class="card-header-title">Tell some information</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <b-field>
            <b-select
              placeholder="-- info --"
              size="is-small"
              v-model="tellInfo"
            >
              <option disabled value>-- info --</option>
              <option
                v-for="info in knowledge"
                v-bind:key="info"
                v-bind:value="info"
                >{{ info }}</option
              >
            </b-select>
          </b-field>
          <info-entry v-bind:info="tellData"></info-entry>
        </div>
      </div>
      <footer class="card-footer">
        <a class="card-footer-item" @click="onTell">Tell</a>
      </footer>
    </b-collapse>
    <b-collapse class="card" aria-id="asked-questions">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="asked-questions"
      >
        <p class="card-header-title">Previous questions asked</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <div v-for="q in questions" v-bind:key="q.id"> 
            <info-entry v-bind:info="{action:q.action, terms:q.getTerms()}"></info-entry>
          </div>
        </div>
      </div>
    </b-collapse>
  </div>
  <!-- Below is for if agent is not in a conversation -->
  <div
    id="conversation-tab"
    class="game-tab"
    style="text-align: center;"
    v-else
  >
    you are not in a conversation
  </div>
</template>

<script lang="ts">
import {
  ClientAPI,
  Agent,
  Room,
  Info,
  Item
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import infoEntry from "./infoEntry.vue";

@Component({
  components: {
    "info-entry": infoEntry
  }
})
export default class ConverstaionTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  // Toggle what to display depending on if in a trade
  inConvo = false;
  @Watch("trigger")
  updateConvo() {
    // this.inConvo = true;
    this.inConvo = ClientAPI.playerAgent
      ? ClientAPI.playerAgent.conversation !== undefined
      : false;
  }
  get otherAgentName() {
    if (ClientAPI.playerAgent === undefined) {
      return " ";
    }
    return ClientAPI.playerAgent.conversation.getAgents(
      ClientAPI.playerAgent
    )[0].agentName;
  }
  leaveConvo() {
    ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
  }

  // For question asking
  @Prop({ default: [] }) defaultActions: string[];
  @Prop({ default: [] }) agents;
  @Prop({ default: [] }) items;
  @Prop({ default: [] }) rooms;

  actionSelected = "";
  questionFields = [];
  questionInfo = {};
  questionData = {} as any;
  @Watch("actionSelected")
  onActionSelected() {
    this.questionInfo = {};
    const action =
      this.actionSelected === this.defaultActions[0]
        ? undefined
        : this.actionSelected;
    const dummyInfo = {
      agents: [],
      items: [],
      locations: [],
      quantities: [],
      factions: []
    };
    const terms: string[] = Object.keys(
      action
        ? Info.ACTIONS[action].getTerms(dummyInfo)
        : Info.PREDICATE.TAL.getTerms(dummyInfo as any)
    );
    const index = terms.indexOf("action");
    if (index !== -1) {
      terms.splice(index);
    }
    this.questionFields = terms;
  }
  getFieldItems(val: string) {
    if (ClientAPI.playerAgent === undefined) {
      return [];
    }
    val = val.replace(/\d/, "");
    switch (val) {
      case "agent":
        return this.agents;
      case "loc":
        return this.rooms;
      case "item":
        return this.items;
      case "info":
        return;
        Array.from((ClientAPI.playerAgent as any)._knowledge).map(info => {
          return { name: info, id: info };
        });
      case "faction":
        return [];
      default:
        return [];
    }
  }
  infoEntryData() {
    const terms = Object.assign({}, this.questionInfo);
    for (const key in this.questionInfo) {
      switch (key.replace(/\d/, "")) {
        case "agent":
          terms[key] = Agent.getByID(terms[key]);
          break;
        case "loc":
          terms[key] = Room.getByID(terms[key]);
          break;
        case "item":
          terms[key] = Item.getByID(terms[key]);
          break;
        case "info":
          terms[key] = Info.getByID(terms[key]);
          break;
        case "faction":
          break;
        case "quantity":
          break;
        case "time":
          break;
        case "quest":
          break;
        default:
          break;
      }
    }
    this.questionData = {
      action: this.actionSelected,
      terms
    };
  }
  onAsk() {
    console.log("Asked!");
    const q: any = Object.assign({}, this.questionInfo);
    Object.keys(q).forEach(key => {
      q[key] = {id: q[key]};
    });
    q.action = this.actionSelected === this.defaultActions[0] ? undefined : this.actionSelected;
    ClientAPI.askQuestion(q);
  }

  // For telling info
  tellInfo = 0;
  knowledge = [];
  tellData = {};
  @Watch("trigger")
  updateKnowledge() {
    this.knowledge = ClientAPI.playerAgent
      ? (ClientAPI.playerAgent as any)._knowledge
      : [];
  }
  @Watch("tellInfo")
  updateTellData() {
    this.told = false;
    const info = Info.getByID(this.tellInfo);
    if (!info) {
      return;
    }
    this.tellData = {
      action: info.action,
      terms: info.getTerms()
    };
  }
  told = false;
  onTell() {
    console.log(Info.getByID(this.tellInfo));
    if (!this.told) {
      ClientAPI.tellInfo(Info.getByID(this.tellInfo)).finally(() => {
        this.told = true;
      });
    }
  }

  // Update asked questions in conversation
  questions = [];
  @Watch("trigger")
  updateQuestions() {
    if (!ClientAPI.playerAgent || !ClientAPI.playerAgent.conversation) {
      return;
    }
    this.questions = ClientAPI.playerAgent.conversation.askedQuestions;
  }
}
</script>

<style>
#conversation-tab {
  text-align: left;
}
#conversation-info {
  text-align: center;
  margin-bottom: 12px;
}
.field {
  display: inline-block;
}
.card {
  margin-top: 5px;
}
a.card-footer-item {
  padding: 6px;
}
</style>
