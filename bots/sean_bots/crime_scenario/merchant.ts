import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, Faction, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../../utils/helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let strategy;

class MerchantMember {
    criminals: Set<Agent>;
    crimesToReport: Set<Info>;
    infoIdx: number;
    state: string;
    // convo related variables
    conUpdate: number;
    prevInfoLen: number;
    asked = false;
    traded = false;
    answeredQuestions = new Set<Info>();
    // room related variables
    talked = new Set<Agent>();
    roomUpdate: number;
    requestedAgents = new Set<Agent>();
    // travel related variables
    lastLoc: Room;
    visitedLastLoc: boolean;

    constructor(criminals = new Set<Agent>(), infoIdx = 0) {
        this.criminals = criminals;
        this.infoIdx = infoIdx;
        this.crimesToReport = new Set<Info>();
    }

    clearAgentSearchData() {
        this.lastLoc = undefined;
        this.visitedLastLoc = false;
    }

    clearRoomData() {
        this.requestedAgents.clear();
        this.roomUpdate = Date.now();
        this.talked.clear();
    }

    prepForConversation() {
        this.conUpdate = 0;
        this.prevInfoLen = 0;
        this.asked = false;
        this.traded = false;
        this.answeredQuestions.clear();
    }

    /**
     * Assumes that agent is not in current room
     * @param agent
     */
    async navigateToAgentStep(agent: Agent) {
        if (this.lastLoc === undefined) {
            this.lastLoc = Helper.findLastKnownLocation(agent);
        }
        if (ClientAPI.playerAgent.room === this.lastLoc) {
            this.visitedLastLoc = true;
        }
        const nextDest = this.visitedLastLoc || this.lastLoc === undefined ? "random" : this.lastLoc.roomName;
        await this.dumbNavigateStep(nextDest);
        this.clearRoomData();
    }

    /**
     * This should eventually be replaced by a real navigation algorithm
     */
    async dumbNavigateStep(roomName: string) {
        if (ClientAPI.playerAgent.room.roomName !== roomName) {
            const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
            const dest = potentialRooms.find(room => room.roomName === roomName);
            if (dest) await ClientAPI.moveToRoom(dest);
            else await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
        }
    }

    async reportCrimesToPolice() {
        if (ClientAPI.playerAgent.conversation) {
            const other = Helper.getOthersInConversation()[0];
            if (other.faction && other.faction.factionType === "police") {
                for (const info of this.crimesToReport) {
                    await ClientAPI.tellInfo(info);
                    this.crimesToReport.delete(info);
                }
            }
            this.state = "conversation";
            this.prepForConversation();
        }
        else {
            for (const agent of Helper.getOthersInRoom()) {
                if (!agent.conversation && agent.faction &&
                agent.faction.factionType === "police" &&
                !this.requestedAgents.has(agent)) {
                    await ClientAPI.requestConversation(agent);
                    this.requestedAgents.add(agent);
                    this.roomUpdate = Date.now();
                    return;
                }
            }
            await this.wander();
        }
    }

    public async convHanlder() {
        if (ClientAPI.playerAgent.trade) {
            // TODO: some trade logic
        }
        else if (ClientAPI.playerAgent.conversation) {
            const other = Helper.getOthersInConversation()[0];
            if (!this.conUpdate) this.conUpdate = Date.now();
            if (!this.prevInfoLen) this.prevInfoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;

            // give other agent time to interact and extend timer when they tell us something
            const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
            if (Date.now() - this.conUpdate <= Helper.WAIT_FOR_OTHER || this.prevInfoLen < infoLen) {
                if (this.prevInfoLen < infoLen) {
                    this.prevInfoLen = infoLen;
                    this.conUpdate = Date.now();
                }
            }
            else {
                // console.log(username + " leaving conversation with " + other + " due to inactivity");
                await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
            }
        }
        else {
            this.state = "";
            this.clearRoomData();
        }
    }

    async wander() {
        if (ClientAPI.playerAgent.conversation) {
            this.state = "conversation";
            this.prepForConversation();
        }
        else {
            const roomItems = ClientAPI.playerAgent.room.getItems();
            if (roomItems.length > 0) {
                const itemsToTake: Item[] = [];
                for (const item of roomItems) {
                    if (!item.itemTags.has("illegal")) {
                        itemsToTake.push(item);
                    }
                }
                if (itemsToTake.length > 0) {
                    await ClientAPI.takeItems(itemsToTake);
                    return;
                }
            }
            if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
                await ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]);
            }
            else if (Date.now() - this.roomUpdate > Helper.WAIT_FOR_OTHER) {
                await this.dumbNavigateStep("random");
                this.state = "";
            }
        }
    }

    public async act() {
        switch (this.state) {
            case "reportCrime":
                await this.reportCrimesToPolice();
                break;
            case "conversation":
                await this.convHanlder();
                break;
            case "wander":
                await this.wander();
                break;
            default:
                this.detectCrimeOnSelf();
                if (this.crimesToReport.size > 0) this.state = "reportCrime";
                else this.state = "wander";
                break;
        }
    }

    protected markCrimeAndCriminal(criminal: Agent, crime: Info) {
        // may need reworking as we manage the way death is handled and reported
        if (!(criminal.agentStatus.has("dead"))) {
            this.criminals.add(criminal);
            this.crimesToReport.add(crime);
        }
    }

    public detectCrimeOnSelf() {
        const knowledge = ClientAPI.playerAgent.knowledge;
        for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
            const info = knowledge[this.infoIdx];
            const terms = info.getTerms();
            const item: Item = terms.item;
            switch (info.action) {
                case "STOLE":
                    this.markCrimeAndCriminal(terms.agent1, info);
                    /* falls through */
                case "GAVE":
                    if (item.itemTags.has("illegal") &&
                    terms.agent1 !== ClientAPI.playerAgent &&
                    terms.agent2 !== ClientAPI.playerAgent) {
                        this.markCrimeAndCriminal(terms.agent1, info);
                        this.markCrimeAndCriminal(terms.agent2, info);
                    }
                    break;
                case "PICKUP":
                    if (item.itemTags.has("illegal") && terms.agent !== ClientAPI.playerAgent) {
                        this.markCrimeAndCriminal(terms.agent, info);
                    }
                    break;
            }
        }
    }
}

/**
 * Main triggers act at random time interval when possible
 */
function main() {
    if (!acting) {
        acting = true;
        act().catch(err => {
            console.log(err);
        }).finally(() => {
            acting = false;
        });
    }
    // tslint:disable-next-line: ban
    setTimeout(main, 100);
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    await strategy.act();
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        strategy = new MerchantMember();
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();