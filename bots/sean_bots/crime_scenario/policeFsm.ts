import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, Faction, IDObject, ActionArrestAgent } from "panoptyk-engine/dist/";
import * as Helper from "../../utils/helper";
import { Strategy, ActionState, BehaviorState, SuccessAction, SuccessBehavior, FailureAction, FailureBehavior } from "../../lib/index";
import { RequestConersationState, LeaveConersationState } from "../../utils/index";
import { IdleState } from "../../john_bots/idleAState";
import { MoveState } from "../../john_bots/moveAState";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let strategy: Strategy;

class PoliceMember extends Strategy {
    criminals: Set<Agent>;
    infoIdx: number;

    constructor(criminals = new Set<Agent>(), infoIdx = 0) {
        super();
        this.criminals = criminals;
        this.infoIdx = infoIdx;
    }

    protected addCriminalIfAlive(criminal: Agent) {
        // may need reworking as we manage the way death is handled and reported
        if (criminal && !(criminal.agentStatus.has("dead"))) {
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
    public async act() {
        this.currentBehavior.act();
    }
}

class PoliceDetective extends PoliceMember {
    public async act() {
        this.currentBehavior.act();
    }
}

class PolicePatrol extends BehaviorState {
    idleTimeRoom: number;
    knownCriminals: Set<Agent>;
    lastUpdate: number;

    constructor(knownCriminals: Set<Agent>, idleTimeRoom = 10000, nextState?: () => BehaviorState) {
        super(nextState);
        this.knownCriminals = knownCriminals;
        this.idleTimeRoom = idleTimeRoom;
        this.lastUpdate = Date.now();
    }

    public async act() {
        if (ClientAPI.playerAgent.conversation) {
            if (!(this.currentActionState instanceof ListenToOther)) {
                this.currentActionState = new ListenToOther(Helper.WAIT_FOR_OTHER);
            }
        }
        else {
            for (const agent of ClientAPI.playerAgent.room.occupants) {
                if (this.knownCriminals.has(agent)) {
                    this.currentActionState = new PoliceArrestAgent(agent);
                    break;
                }
            }

            if (this.currentActionState && !(this.currentActionState instanceof SuccessAction) &&
            !(this.currentActionState instanceof FailureAction)) {
                this.lastUpdate = Date.now();
            }
            else if (Date.now() - this.lastUpdate > this.idleTimeRoom) {
                this.currentActionState = new PoliceNavigate("random");
            }
        }
        this.currentActionState = await this.currentActionState.tick();
    }

    public nextState() {
        return this;
    }
}

class ListenToOther extends ActionState {
    other: Agent;
    timeout: number;
    lastUpdate: number;
    infoAboutOther: number;

    constructor(timeout: number, nextState?: () => ActionState) {
        super(nextState);
        this.other = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
        this.timeout = timeout;
        this.infoAboutOther = ClientAPI.playerAgent.getInfoByAgent(this.other).length;
        this.lastUpdate = Date.now();
    }

    public async act() {
        const currentInfo = ClientAPI.playerAgent.getInfoByAgent(this.other).length;
        if (this.infoAboutOther < currentInfo) {
            this.lastUpdate = Date.now();
            this.infoAboutOther = currentInfo;
        }
    }

    public nextState() {
        if (Date.now() - this.lastUpdate > this.timeout) {
            return new LeaveConersationState();
        }
        return this;
    }
}

class PoliceArrestAgent extends ActionState {
    private targetAgent: Agent;
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    private _impossible = false;
    public get impossible() {
        return this._impossible;
    }

    constructor(targetAgent: Agent, nextState: () => ActionState = undefined) {
        super(nextState);
        this.targetAgent = targetAgent;
    }

    public async act() {
        if (ClientAPI.playerAgent.room.hasAgent(this.targetAgent)) {
            await ClientAPI.arrestAgent(this.targetAgent);
            this._completed = true;
        }
        else {
            this._impossible = true;
        }
    }

    public nextState(): ActionState {
        if (this._completed) return SuccessAction.instance;
        else if (this._impossible) return FailureAction.instance;
        else return this;
    }
}

class ConverseWithAgent extends BehaviorState {
    agent: Agent;
    timeout: number;
    acceptRejection: boolean;
    conversing = false;
    failed = false;

    constructor(agent: Agent, acceptRejection = true, timeout = Infinity, nextState?: () => BehaviorState) {
        super(nextState);
        this.agent = agent;
        this.timeout = timeout;
        this.acceptRejection = acceptRejection;
    }

    public async act() {
        if (ClientAPI.playerAgent.conversation) {
            const conversation = ClientAPI.playerAgent.conversation;
            if (conversation.contains_agent(this.agent)) {
                this.conversing = true;
                this.currentActionState = SuccessAction.instance;
            }
            else {
                this.conversing = false;
                this.currentActionState = new LeaveConersationState();
            }
        }
        else {
            this.conversing = false;
            if (ClientAPI.playerAgent.room.hasAgent(this.agent)) {
                if (!ClientAPI.playerAgent.activeConversationRequestTo(this.agent)) {
                    if (!(this.currentActionState instanceof SuccessAction && this.acceptRejection)) {
                        this.currentActionState = new RequestConersationState(this.agent);
                    }
                    else this.failed = true;
                }
            }
            else this.failed = true;
        }
        this.currentActionState = await this.currentActionState.tick();
    }

    public nextState(): BehaviorState {
        if (this.conversing) return SuccessBehavior.instance;
        else if (this.deltaTime > this.timeout || this.failed) return FailureBehavior.instance;
        else return this;
    }
}

class PoliceNavigateToAgent extends BehaviorState {
    agent: Agent;
    timeout: number;
    lastKnownLoc: Room;
    visitedLastLoc = false;
    found = false;

    canVisitRoom(room: Room): boolean {
        if (room && room.roomTags.has("private") &&
        Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
            return false;
        }
        return true;
    }

    constructor(agent: Agent, timeout = Infinity, nextState?: () => BehaviorState) {
        super(nextState);
        this.agent = agent;
        this.timeout = timeout;
        this.lastKnownLoc = Helper.findLastKnownLocation(this.agent);
    }

    public async act() {
        if (ClientAPI.playerAgent.room.hasAgent(this.agent)) {
            this.found = true;
            this.currentActionState = SuccessAction.instance;
        }
        else {
            if (this.found) {
                // we found the agent and they moved
                this.found = false;
                this.visitedLastLoc = false;
                this.lastKnownLoc = Helper.findLastKnownLocation(this.agent);
            }

            if (this.currentActionState === undefined ||
                this.currentActionState instanceof SuccessAction ||
                this.currentActionState instanceof FailureAction) {
                if (!this.visitedLastLoc && this.canVisitRoom(this.lastKnownLoc)) {
                    if (ClientAPI.playerAgent.room === this.lastKnownLoc) this.visitedLastLoc = true;
                    else this.currentActionState = new PoliceNavigate(this.lastKnownLoc.roomName);
                }
                else this.currentActionState = new PoliceNavigate("random");
            }
        }
        this.currentActionState = await this.currentActionState.tick();
    }

    public nextState(): BehaviorState {
        if (this.found) return SuccessBehavior.instance;
        else if (this.deltaTime > this.timeout) return FailureBehavior.instance;
        else return this;
    }
}

class PoliceNavigate extends ActionState {
    destName: string;
    timeout: number;
    completed = false;
    cannotComplete = false;

    constructor(dest: string, timeout = Infinity, nextState: () => ActionState = undefined) {
        super(nextState);
        this.destName = dest;
        this.timeout = timeout;
    }

    public async act() {
        let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(room => room.roomName === this.destName);
        if (dest) {
            if (Helper.getPlayerRank(ClientAPI.playerAgent) <= 100 || !dest.roomTags.has("private")) {
                await ClientAPI.moveToRoom(dest);
                this.completed = true;
            }
            else {
                this.cannotComplete = true;
            }
        }
        else {
            if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
                potentialRooms = potentialRooms.filter(room => !room.roomTags.has("private"));
            }
            await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
        }
    }

    public nextState(): ActionState {
        if (this.completed) {
            return SuccessAction.instance;
        }
        else if (this.deltaTime > this.timeout || this.cannotComplete) {
            return FailureAction.instance;
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

function pickStrat(): Strategy {
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