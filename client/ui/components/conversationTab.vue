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
            >
              <option disabled value>-- {{ field }} --</option>
              <option v-bind:value="undefined">???</option>
              <option
                v-for="item in getFieldItems(field)"
                v-bind:key="item.id"
                v-bind:value="item.model"
                >{{ item.text }}</option
              >
            </b-select>
          </b-field>
          <info-entry
            v-bind:newFoundQuery="true"
            v-bind:query="questionInfoEntry"
          ></info-entry>
        </div>
      </div>
      <footer class="card-footer">
        <a class="card-footer-item" @click="onAsk">Ask</a>
      </footer>
    </b-collapse>
    <b-collapse class="card" aria-id="tell-info">
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
              @input="onTellSelect"
            >
              <option disabled value>-- info --</option>
              <option
                v-for="info in knowledge"
                v-bind:key="info.id"
                v-bind:value="info"
                >{{ getType(info) }}#{{ info.id }}</option
              >
            </b-select>
          </b-field>
          <info-entry
            v-bind:key="tellInfo.id"
            v-bind:info="tellInfo"
          ></info-entry>
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
        <div class="content" style="max-height: 200px; overflow-y:auto;">
          <div v-for="q in questions" v-bind:key="q.id">
            <info-entry v-bind:info="q"></info-entry>
          </div>
        </div>
      </div>
    </b-collapse>
    <b-collapse class="card" aria-id="tell-item-ownership">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="tell-item-ownership"
      >
        <p class="card-header-title">Tell item ownership</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <b-field>
            <b-select
              placeholder="-- item --"
              size="is-small"
              v-model="tellItem"
            >
              <option disabled value>-- item --</option>
              <option
                v-for="item in inventory"
                v-bind:key="item.id"
                v-bind:value="item"
                >{{ item.itemName }}</option
              >
            </b-select>
          </b-field>
          <item-entry
            v-bind:key="tellItem.id"
            v-bind:item="tellItem"
          ></item-entry>
        </div>
      </div>
      <footer class="card-footer">
        <a class="card-footer-item" @click="onTellItem">Tell</a>
      </footer>
    </b-collapse>
    <b-collapse class="card" aria-id="complete-quest">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="complete-quest"
      >
        <p class="card-header-title">Quest</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <b-field>
            <b-select
              placeholder="-- quest --"
              size="is-small"
              v-model="targetQuest"
              @input="onQuestSelect"
            >
              <option disabled value>-- quest --</option>
              <option
                v-for="quest in quests"
                v-bind:key="quest.id"
                v-bind:value="quest"
                >{{ quest.id }}</option
              >
            </b-select>
          </b-field>
          <quest-entry
            v-bind:key="targetQuest.id"
            v-bind:quest="targetQuest"
          ></quest-entry>
          <b-field v-if="targetQuest.type !== 'item'">
            <b-select
              placeholder="-- info --"
              size="is-small"
              v-model="questInfo"
            >
              <option disabled value>-- info --</option>
              <option
                v-for="info in relevantInfo"
                v-bind:key="info.id"
                v-bind:value="info"
                >{{ getType(info) }}#{{ info.id }}</option
              >
            </b-select>
          </b-field>
          <b-field v-else>
            <b-select
              placeholder="-- item --"
              size="is-small"
              v-model="questItem"
            >
              <option disabled value>-- item --</option>
              <option
                v-for="item in relevantItem"
                v-bind:key="item.id"
                v-bind:value="item"
                >{{ item.itemName }}</option
              >
            </b-select>
          </b-field>
          <info-entry v-if="targetQuest.type !== 'item'"
            v-bind:key="questInfo.id"
            v-bind:info="questInfo"
          ></info-entry>
          <item-entry v-else
            v-bind:key="questItem.id"
            v-bind:item="questItem"
          ></item-entry>
        </div>
      </div>
      <footer class="card-footer">
        <a v-if="targetQuest.type !== 'item'" class="card-footer-item" @click="onQuestTurnInInfo">Turn in Info</a>
        <a v-else-if="targetQuest.type === 'item'" class="card-footer-item" @click="onQuestTurnInItem">Turn in Item</a>
      </footer>
    </b-collapse>
  </div>
  <!-- Below is for if agent is not in a conversation -->
  <div
    id="conversation-tab"
    class="game-tab"
    style="text-align: center;"
    v-else
  >
    you are not in a conversation...
  </div>
</template>

<script lang="ts">
import {
  ClientAPI,
  Agent,
  Room,
  Info,
  Item,
  Quest
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import infoEntry from "./infoEntry.vue";
import questEntry from "./questEntry.vue";
import ItemEntry from "./itemEntry.vue";

@Component({
  components: {
    "info-entry": infoEntry,
    "quest-entry": questEntry,
    "item-entry": ItemEntry
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

  // For question asking
  @Prop({ default: [] }) defaultActions: string[];
  @Prop({ default: [] }) agents;
  @Prop({ default: [] }) items;
  @Prop({ default: [] }) rooms;
  @Prop({ default: [] }) knowledge;

  actionSelected = "";
  questionFields = [];
  questionInfo = {};
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
    let items: { name: string; id: number; model: any }[];
    val = val.replace(/\d/, "");
    switch (val) {
      case "agent":
        items = this.agents.map(a => {
          return { id: a.id, text: a.agentName, model: a };
        });
        break;
      case "loc":
        items = this.rooms.map(r => {
          return { id: r.id, text: r.roomName, model: r };
        });
        break;
      case "item":
        items = this.items.map(i => {
          return { id: i.id, text: i.itemName, model: i };
        });
        break;
      case "info":
        items = this.knowledge.map(k => {
          return { id: k.id, text: k.id, model: k };
        });
        break;
      case "faction":
        items = [];
        break;
      default:
        items = [];
        break;
    }
    return items;
  }
  get questionInfoEntry() {
    const q: any = Object.assign({}, this.questionInfo);
    q.action =
      this.actionSelected === this.defaultActions[0]
        ? undefined
        : this.actionSelected;
    return q;
  }
  onAsk() {
    console.log("Asked!");
    const q: any = Object.assign({}, this.questionInfo);
    q.action =
      this.actionSelected === this.defaultActions[0]
        ? undefined
        : this.actionSelected;
    ClientAPI.askQuestion(q);
  }

  // For telling info
  tellInfo: Info = {} as any;
  told = false;
  onTellSelect(val) {
    this.told = false;
  }
  onTell() {
    if (!this.told) {
      ClientAPI.tellInfo(this.tellInfo).finally(() => {
        this.told = true;
      });
    }
  }

  // Update asked questions in conversation
  questions = [];
  quests: Quest[] = [];
  inventory: Item[] = [];
  @Watch("trigger")
  updateTab() {
    if (!ClientAPI.playerAgent || !ClientAPI.playerAgent.conversation) {
      return;
    }
    this.quests = [];
    // add any new quests assigned by agent
    for (const quest of ClientAPI.playerAgent.activeAssignedQuests) {
      if (ClientAPI.playerAgent.conversation.contains_agent(quest.giver)) {
        this.quests.push(quest);
      }
    }
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
      if (ClientAPI.playerAgent.conversation.contains_agent(quest.giver)) {
        this.quests.push(quest);
      }
    }
    this.inventory = ClientAPI.playerAgent.inventory;
    this.questions = ClientAPI.playerAgent.conversation.askedQuestions;
    this.onQuestSelect();
  }

  relevantInfo = [];
  relevantItem = [];
  targetQuest: Quest = {} as any;
  turnedInInfo: Info[] = [];
  questInfo: Info = {} as any;
  questItem: Item = {} as any;

  get isQuestGiver(): boolean {
    return ClientAPI.playerAgent === this.targetQuest.giver;
  }

  // For quest turn in
  onQuestSelect() {
    // list of info that can complete quest
    if (this.targetQuest) {
      if (this.targetQuest.type !== "item") {
        this.relevantInfo = [];
        this.turnedInInfo = this.targetQuest.turnedInInfo;
        for (const info of ClientAPI.playerAgent.knowledge) {
          if (
            !this.targetQuest.hasTurnedIn(info) &&
            this.targetQuest.checkSatisfiability(info)
          ) {
            this.relevantInfo.push(info);
          }
        }
      } else if (this.targetQuest.type === "item") {
        this.relevantItem = [];
        for (const item of this.items) {
          if (item.agent && item.agent.id === ClientAPI.playerAgent.id && item.sameAs(this.targetQuest.item)) {
            this.relevantItem.push(item);
          }
        }
      }
    }
  }

  onQuestTurnInInfo() {
    ClientAPI.turnInQuestInfo(this.targetQuest, this.questInfo);
  }

  onQuestTurnInItem() {
    ClientAPI.turnInQuestItem(this.targetQuest, this.questItem);
  }

  onCompleteQuest() {
    ClientAPI.completeQuest(this.targetQuest);
  }

  tellItem: Item = {} as any;
  onTellItem() {
    if (this.tellItem) {
      ClientAPI.tellItemOwnership([this.tellItem]);
    }
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
