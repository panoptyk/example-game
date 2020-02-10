import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, Faction, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../utils/helper";
import { State } from "../state_based_bots/state";
import { ActionState } from "../state_based_bots/ActionStates/actionState";
import { BehaviorState } from "../state_based_bots/BehaviorStates/behaviorState";
import { Strategy } from "../state_based_bots/Strategy/strategy";
import { SuccessAction } from "../state_based_bots/ActionStates/successAState";
import { FailureAction } from "../state_based_bots/ActionStates/failureAState";
import { IdleState } from "../state_based_bots/ActionStates/idleAState";
import { MoveState } from "../state_based_bots/ActionStates/moveAState";
import { SuccessBehavior } from "../state_based_bots/BehaviorStates/successBState";
import { FailureBehavior } from "../state_based_bots/BehaviorStates/failureBState";
import { RequestConersationState } from "../state_based_bots/ActionStates/reqConvoAState";

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
    public async act() {
    }
}

class PoliceDetective extends PoliceMember {
    public async act() {
        if (this.currentBehavior !== undefined) {

        }
        else {
            this.currentBehavior = new PolicePatrol(undefined);
        }
        this.currentBehavior.act();
    }
}

class PolicePatrol extends BehaviorState {
    public nextState() {
        return this;
    }
}

class PoliceReportIn extends BehaviorState {
    private _complete = false;
    private static _leader: Agent;
    static get leader(): Agent {
        if (!PoliceReportIn._leader) {
            for (const agent of ClientAPI.seenAgents) {
                if (agent.faction === ClientAPI.playerAgent.faction &&
                Helper.getPlayerRank(agent) === 0) {
                    PoliceReportIn._leader = agent;
                    break;
                }
            }
        }
        return this._leader;
    }

    public async act() {
        if (this.currentActionState === undefined ||
        this.currentActionState instanceof SuccessAction ||
        this.currentActionState instanceof FailureAction) {
            
        }
        this.currentActionState = await this.currentActionState.tick();
    }

    public nextState() {
        if (this._complete) return new PolicePatrol(undefined);
        return this;
    }
}

class ConverseWithAgent extends BehaviorState {
    agent: Agent;
    timeout: number;
    acceptRejection: boolean;
    conversing = false;
    failed = false;

    constructor(agent: Agent, acceptRejection = true, timeout = Infinity, nextState?: () => BehaviorState) {
        super(undefined, nextState);
        this.agent = agent;
        this.timeout = timeout;
        this.acceptRejection = acceptRejection;
    }

    public async act() {
        if (ClientAPI.playerAgent.conversation) {
            const conversation = ClientAPI.playerAgent.conversation;
            if (conversation.contains_agent(this.agent)) {
                this.conversing = true;
            }
            else {
                this.conversing = false;
                await ClientAPI.leaveConversation(conversation);
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

class NavigateToAgent extends BehaviorState {
    agent: Agent;
    timeout: number;
    lastKnownLoc: Room;
    visitedLastLoc = false;
    found = false;

    constructor(agent: Agent, timeout = Infinity, nextState?: () => BehaviorState) {
        super(undefined, nextState);
        this.agent = agent;
        this.timeout = timeout;
        this.lastKnownLoc = Helper.findLastKnownLocation(this.agent);
    }

    public async act() {
        if (!ClientAPI.playerAgent.room.hasAgent(this.agent)) {
            if (this.found) {
                // we found the agent and they moved
                this.found = false;
                this.visitedLastLoc = false;
                this.lastKnownLoc = Helper.findLastKnownLocation(this.agent);
            }

            if (this.currentActionState === undefined ||
                this.currentActionState instanceof SuccessAction ||
                this.currentActionState instanceof FailureAction) {
                if (!this.visitedLastLoc) {
                    if (ClientAPI.playerAgent.room === this.lastKnownLoc) this.visitedLastLoc = true;
                    else this.currentActionState = new PoliceNavigate(this.lastKnownLoc.roomName);
                }
                else this.currentActionState = new PoliceNavigate("random");
            }
        }
        else {
            this.found = true;
            this.currentActionState = SuccessAction.instance;
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
    moveAttempts: number;
    completed = false;
    cannotComplete = false;

    constructor(dest: string, moveAttempts = Infinity, nextState: () => ActionState = undefined) {
        super(nextState);
        this.destName = dest;
        this.moveAttempts = moveAttempts;
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
            this.moveAttempts--;
        }
    }

    public nextState(): ActionState {
        if (this.completed) {
            return SuccessAction.instance;
        }
        else if (this.moveAttempts === 0 || this.cannotComplete) {
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