<template>
  <div class="info-entry">
    <span v-for="b in sentence" v-bind:key="b.text" v-bind:class="b.type">
      {{ b.text }}
    </span>
  </div>
</template>

<script lang="ts">
import { Info } from "panoptyk-engine/dist/client";
import Sentence from "../../utils/sentence";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class InfoEntry extends Vue {
  @Prop({ default: undefined }) info: Info;
  @Prop({ default: undefined }) query: any;
  @Prop({ default: false }) newFoundQuery;

  get sentence() {
    if (this.newFoundQuery) {
      // We are currently cheating the query info to be treated as fact
      return this.badQuerySentence(this.query);
    } else if (this.info && this.info.id) {
      if (!this.info.isQuery()) {
        return Sentence.fromInfo(this.info);
      } else {
        const infoTerms = this.info.getTerms();
        return this.badQuerySentence(infoTerms);
      }
    }
    return [];
  }

  badQuerySentence(queryTerms): Sentence.Block[] {
    const dummyInfo = {
      agents: [],
      items: [],
      locations: [],
      quantities: [],
      factions: []
    };
    const terms = queryTerms.action
      ? Info.ACTIONS[queryTerms.action].getTerms(dummyInfo)
      : Info.PREDICATE.TAL.getTerms(dummyInfo as any);
    if (!terms.action) {
      terms.action = "???";
    }
    Object.keys(terms).forEach(k => {
      if (!queryTerms[k]) {
        const val = k.replace(/\d/, "");
        switch (val) {
          case "agent":
            terms[k] = {agentName: "???"};
            break;
          case "loc":
            terms[k] = {roomName: "???"};
            break;
          case "item":
            terms[k] = {itemName: "???"};
            break;
          case "info":
            terms[k] = {id: "???"};
            break;
          case "faction":
            terms[k] = {factionName: "???"};
            break;
          default:
            break;
        }
      } else {
        terms[k] = queryTerms[k];
      }
    });
    const info = {
      isQuery() {
        return false;
      },
      getTerms: () => {
        return terms;
      }
    };
    return Sentence.fromInfo(info as any);
  }
}
</script>

<style></style>
