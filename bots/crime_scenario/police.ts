import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, Faction, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../utils/helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let strategy;

class PoliceMember {
    criminals: Set<Agent>;
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
        await this.policeNavigateStep(nextDest);
    }

    /**
     * this should eventually be replaced by a real navigation algorithm
     */
    async policeNavigateStep(roomName: string) {
        let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(room => room.roomName === roomName);
        if (dest) {
            if (Helper.getPlayerRank(ClientAPI.playerAgent) <= 100 || !dest.roomTags.has("private")) {
                await ClientAPI.moveToRoom(dest);
            }
        }
        else {
            if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
                potentialRooms = potentialRooms.filter(room => !room.roomTags.has("private"));
            }
            await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
        }
        this.clearRoomData();
    }

    public async act() {}

    protected addCriminalIfAlive(criminal: Agent) {
        // may need reworking as we manage the way death is handled and reported
        if (!(criminal.agentStatus.has("dead"))) {
            this.criminals.add(criminal);
        }
    }

    public detectCrime() {
        const knowledge = ClientAPI.playerAgent.knowledge;
        for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
            const info = knowledge[this.infoIdx];
            const terms = info.getTerms();
            const item: Item = terms.item;
            switch (info.action) {
                case "STOLE":
                    this.addCriminalIfAlive(terms.agent1);
                    /* falls through */
                case "GAVE":
                    if (item.itemTags.has("illegal")) {
                        this.addCriminalIfAlive(terms.agent1);
                        this.addCriminalIfAlive(terms.agent2);
                    }
                    break;
                case "PICKUP":
                    if (item.itemTags.has("illegal")) {
                        this.addCriminalIfAlive(terms.agent);
                    }
                    break;
            }
        }
    }
}

class PoliceLeader extends PoliceMember {
    assignedQuest: Set<Agent> = new Set<Agent>();
    targetedCriminals: Set<Agent> = new Set<Agent>();

    nextCriminalQuestTarget(): Agent {
        for (const agent of this.criminals) {
            if (!this.targetedCriminals.has(agent)) {
                return agent;
            }
        }
        return undefined;
    }

    public async assignArrestQuest(agent: Agent, target: Agent) {
        const command = Info.ACTIONS.ARRESTED.question({agent1: agent, agent2: target, time: undefined, loc: undefined});
        await ClientAPI.giveQuest(agent, command, false);
        this.assignedQuest.add(agent);
        this.targetedCriminals.add(target);
    }

    public async convoHanlder() {
        if (ClientAPI.playerAgent.conversation) {
            const other = Helper.getOthersInConversation()[0];
            if (!this.conUpdate) this.conUpdate = Date.now();
            if (!this.prevInfoLen) this.prevInfoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;

            if (other.faction === ClientAPI.playerAgent.faction && !this.assignedQuest.has(other)) {
                const arrestTarget = this.nextCriminalQuestTarget();
                if (arrestTarget) {
                    await this.assignArrestQuest(other, arrestTarget);
                }
            }

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

    public async reqAnyOfficer() {
        if (ClientAPI.playerAgent.conversation) {
            this.state = "conversation";
            this.prepForConversation();
            return;
        }
        else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
            for (const agent of ClientAPI.playerAgent.conversationRequesters) {
                if (agent.faction === ClientAPI.playerAgent.faction && !this.assignedQuest.has(agent)) {
                    await ClientAPI.acceptConversation(agent);
                    return;
                }
            }
        }
        else {
            for (const agent of Helper.getOthersInRoom()) {
                if (agent.faction === ClientAPI.playerAgent.faction && !this.assignedQuest.has(agent)
                && !ClientAPI.playerAgent.activeConversationRequestTo(agent)) {
                    await ClientAPI.requestConversation(agent);
                    return;
                }
            }
        }
        // idle behavior if no officers present
        await this.acceptIncomingConvReq();
    }

    public async acceptIncomingConvReq() {
        if (ClientAPI.playerAgent.conversation) {
            this.state = "conversation";
            this.prepForConversation();
        }
        else {
            if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
                await ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]);
            }
        }
    }

    public async act() {
        switch (this.state) {
            case "conversation":
                await this.convoHanlder();
                break;
            case "assignOfficer":
                await this.reqAnyOfficer();
                break;
            case "idle":
                await this.acceptIncomingConvReq();
                break;
            default:
                this.detectCrime();
                this.state = "idle";
                break;
        }
    }
}

class PoliceDetective extends PoliceMember {
    activeQuest: Quest;
    completedArrestInfo: Info;

    async arrestCriminalsInRoom() {
        for (const agent of Helper.getOthersInRoom()) {
            if (this.criminals.has(agent)) {
                await ClientAPI.arrestAgent(agent);
                return true;
            }
        }
        return false;
    }

    checkTurnIn() {
        if (this.activeQuest) {
            for (const info of ClientAPI.playerAgent.getInfoByAction("ARREST")) {
                if (this.activeQuest.checkSatisfiability(info)) {
                    this.state = "turnIn";
                    this.completedArrestInfo = info;
                    this.clearAgentSearchData();
                    return;
                }
            }
        }
    }

    public async turnInQuest() {
        if (ClientAPI.playerAgent.conversation) {
            const other = Helper.getOthersInConversation()[0];
            if (other !== this.activeQuest.giver) {
                await ClientAPI.leaveConversation();
            }
            else {
                await ClientAPI.completeQuest(this.activeQuest, this.completedArrestInfo);
                this.activeQuest = undefined;
                this.state = "";
            }
        }
        else {
            if (ClientAPI.playerAgent.room.hasAgent(this.activeQuest.giver)) {
                if (!this.activeQuest.giver.conversation ||
                !ClientAPI.playerAgent.activeConversationRequestTo(this.activeQuest.giver)) {
                    await ClientAPI.requestConversation(this.activeQuest.giver);
                }
            }
            else {
                await this.navigateToAgentStep(this.activeQuest.giver);
            }
        }
    }

    public async convoHanlder() {
        if (ClientAPI.playerAgent.conversation) {
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

    async patrol() {
        if (ClientAPI.playerAgent.conversation) {
            this.state = "basicConv";
            this.prepForConversation();
        }
        else {
            const madeArrests = await this.arrestCriminalsInRoom();
            if (madeArrests) {
                this.state = "";
                this.roomUpdate = Date.now();
            }
            else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
                await ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]);
            }
            else if (Date.now() - this.roomUpdate > Helper.WAIT_FOR_OTHER) {
                await this.policeNavigateStep("random");
            }
        }
    }

    public async act() {
        switch (this.state) {
            case "turnIn":
                await this.turnInQuest();
                break;
            case "basicConv":
                await this.convoHanlder();
                break;
            case "patrol":
                await this.patrol();
                break;
            default:
                if (!this.activeQuest && ClientAPI.playerAgent.activeAssignedQuests.length > 0) {
                    this.activeQuest = ClientAPI.playerAgent.activeAssignedQuests[0];
                }
                this.detectCrime();
                this.checkTurnIn();
                break;
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

function pickStrat(): PoliceMember {
    const rank = Helper.getPlayerRank(ClientAPI.playerAgent);
    if (rank === 0) {
        return new PoliceLeader();
    }
    else {
        return new PoliceDetective();
    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        strategy = pickStrat();
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();