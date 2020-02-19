import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, Faction, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../../utils/helper";
import { Strategy, ActionState, BehaviorState, SuccessAction, SuccessBehavior, FailureAction, FailureBehavior } from "../../lib/index";
import { RequestConversationState, LeaveConersationState, MoveState, AcceptConersationState,
    TellInfoState, IdleState, CompleteQuestState
} from "../../utils/index";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let strategy: Strategy;

class PoliceKnowledgeBase {
    criminals: Set<Agent> = new Set<Agent>();
    crimeDatabase: Set<Info> = new Set<Info>();
    requestedAgents: Set<Agent> = new Set<Agent>();
    conversedAgents: Set<Agent> = new Set<Agent>();
    infoIdx = 0;
    private static _instance: PoliceKnowledgeBase;
    static get instance(): PoliceKnowledgeBase {
        if (!PoliceKnowledgeBase._instance) {
            PoliceKnowledgeBase._instance = new PoliceKnowledgeBase();
        }
        return PoliceKnowledgeBase._instance;
    }

    protected registerCrime(criminal: Agent, crime: Info) {
        // may need reworking as we manage the way death is handled and reported
        if (criminal && !(criminal.agentStatus.has("dead"))) {
            this.criminals.add(criminal);
        }
        this.crimeDatabase.add(crime);
    }

    public detectCrime() {
        const knowledge = ClientAPI.playerAgent.knowledge;
        for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
            const info = knowledge[this.infoIdx];
            const terms = info.getTerms();
            const item: Item = terms.item;
            switch (info.action) {
                case "STOLE":
                    this.registerCrime(terms.agent1, info);
                    /* falls through */
                case "GAVE":
                    if (item.itemTags.has("illegal")) {
                        this.registerCrime(terms.agent1, info);
                        this.registerCrime(terms.agent2, info);
                    }
                    break;
                case "PICKUP":
                    if (item.itemTags.has("illegal")) {
                        this.registerCrime(terms.agent, info);
                    }
                    break;
            }
        }
    }
}

class PoliceLeader extends Strategy {
    public async act() {
        this.currentBehavior = await this.currentBehavior.tick();
    }
}

class PoliceDetective extends Strategy {
    private static _activeInstance: PoliceDetective;
    public static get activeInstance(): PoliceDetective {
        return this._activeInstance;
    }

    constructor() {
        super();
        this.currentBehavior = new PolicePatrol(Helper.WAIT_FOR_OTHER, PoliceDetective.patrolTransition);
    }

    public async act() {
        PoliceDetective._activeInstance = this;
        PoliceKnowledgeBase.instance.detectCrime();
        this.currentBehavior = await this.currentBehavior.tick();
    }

    public static patrolTransition(this: PolicePatrol): BehaviorState {
        for (const quest of ClientAPI.playerAgent.activeAssignedQuests) {
            if (quest.giver.faction === ClientAPI.playerAgent.faction && quest.task.action === "ARRESTED") {
                const target = quest.task.getTerms().agent2;
                if (ClientAPI.playerAgent.room.hasAgent(target)) {
                    return new ArrestBehavior(target, quest, PoliceDetective.arrestTransition);
                }
            }
        }
        for (const agent of Helper.getOthersInRoom()) {
            if (agent.faction === ClientAPI.playerAgent.faction && !agent.conversation &&
                !PoliceKnowledgeBase.instance.requestedAgents.has(agent)
            ) {
                if (Helper.hasToldInfo(agent, Array.from(PoliceKnowledgeBase.instance.crimeDatabase))) {
                    PoliceKnowledgeBase.instance.requestedAgents.add(agent);
                }
                else {
                    const toTell = new Set(PoliceKnowledgeBase.instance.crimeDatabase);
                    for (const info of ClientAPI.playerAgent.getInfoByAction("TOLD")) {
                        const terms = info.getTerms();
                        if (terms.agent2 === agent && toTell.has(info)) {
                            toTell.delete(info);
                        }
                    }
                    return new TellInfo(agent, Array.from(toTell), PoliceDetective.tellTransition);
                }
            }
        }
        return this;
    }

    public static turnInTransition(this: TurnInBehavior) {
        if (this.currentActionState instanceof SuccessAction) {
            return new PolicePatrol(Helper.WAIT_FOR_OTHER, PoliceDetective.patrolTransition);
        }
        else if (!ClientAPI.playerAgent.room.hasAgent(this.quest.giver)) {
            return new PoliceNavigateToAgent(this.quest.giver, Infinity,
                function(this: PoliceNavigateToAgent) {
                    if (this.currentActionState instanceof SuccessAction) {
                        return TurnInBehavior.activeInstance;
                    }
                    return this;
                }
            );
        }
        return this;
    }

    public static arrestTransition(this: ArrestBehavior): BehaviorState {
        if (this.currentActionState instanceof SuccessAction) {
            return new TurnInBehavior(this._warrant, PoliceDetective.turnInTransition);
        }
        else if (this.currentActionState instanceof IdleState) {
            return new PolicePatrol(Helper.WAIT_FOR_OTHER, PoliceDetective.patrolTransition);
        }
        return this;
    }

    public static tellTransition(this: TellInfo): BehaviorState {
        if (this.currentActionState instanceof FailureAction ||
        this.currentActionState instanceof SuccessAction) {
            return new PolicePatrol(Helper.WAIT_FOR_OTHER, PoliceDetective.patrolTransition);
        }
        return this;
    }
}

class TurnInBehavior extends BehaviorState {
    quest: Quest;
    solution: Info;

    private static _activeInstance: TurnInBehavior;
    public static get activeInstance(): TurnInBehavior {
        return TurnInBehavior._activeInstance;
    }
    constructor(quest: Quest, nextState?: () => BehaviorState) {
        super(nextState);
        this.quest = quest;
        for (const info of ClientAPI.playerAgent.getInfoByAction(this.quest.task.action)) {
            if (this.quest.checkSatisfiability(info)) {
                this.solution = info;
                break;
            }
        }

        if (!this.solution) {
            this.currentActionState = FailureAction.instance;
        }
        else if (ClientAPI.playerAgent.conversation) {
            if (Helper.getOthersInConversation[0] === this.quest.giver) {
                this.currentActionState = new CompleteQuestState(this.quest, this.solution);
            }
            else {
                this.currentActionState = new LeaveConersationState(TellInfo.leaveTransition);
            }
        }
        else {
            this.currentActionState = new RequestConversationState(this.quest.giver, TurnInBehavior.requestConversationTransition);
        }
    }

    public async act() {
        TurnInBehavior._activeInstance = this;
        this.currentActionState = await this.currentActionState.tick();
    }

    public nextState(): BehaviorState {
        return this;
    }

    static leaveTransition(this: LeaveConersationState): ActionState {
        if (this.completed) {
            return new RequestConversationState(TurnInBehavior.activeInstance.quest.giver, TurnInBehavior.requestConversationTransition);
        }
        return this;
    }

    static requestConversationTransition(this: RequestConversationState): ActionState {
        if (this.completed) {
            PoliceKnowledgeBase.instance.requestedAgents.add(this.targetAgent);
            if (ClientAPI.playerAgent.conversation) {
                return new CompleteQuestState(TurnInBehavior.activeInstance.quest, TurnInBehavior.activeInstance.solution);
            }
        }
        return this;
    }
}

class ArrestBehavior extends BehaviorState {
    _targetAgent: Agent;
    _warrant: Quest;
    private static _activeInstance: ArrestBehavior;
    public static get activeInstance(): ArrestBehavior {
        return ArrestBehavior._activeInstance;
    }

    constructor(targetAgent: Agent, warrant: Quest, nextState?: () => BehaviorState) {
        super(nextState);
        this._targetAgent = targetAgent;
        this._warrant = warrant;
        if (ClientAPI.playerAgent.room.hasAgent(this._targetAgent)) {
            this.currentActionState = new PoliceArrestAgentState(this._targetAgent, ArrestBehavior.arrestTransition);
        }
        else {
            this.currentActionState = new IdleState(ArrestBehavior.idleTransition);
        }
    }

    public async act() {
        ArrestBehavior._activeInstance = this;
        this.currentActionState = await this.currentActionState.tick();
    }

    public static arrestTransition(this: PoliceArrestAgentState): ActionState {
        if (this.completed) {
            return SuccessAction.instance;
        }
        else if (this.doneActing) {
            return new IdleState(ArrestBehavior.idleTransition);
        }
        return this;
    }

    public static idleTransition(this: IdleState): ActionState {
        if (ClientAPI.playerAgent.room.hasAgent(ArrestBehavior.activeInstance._targetAgent)) {
            return new PoliceArrestAgentState(ArrestBehavior.activeInstance._targetAgent, ArrestBehavior.arrestTransition);
        }
        return this;
    }

    public nextState(): BehaviorState {
        return this;
    }
}

class TellInfo extends BehaviorState {
    _targetAgent: Agent;
    _toTell: Info[];

    private static _activeInstance: TellInfo;
    static get activeInstance(): TellInfo {
        return TellInfo._activeInstance;
    }

    constructor(targetAgent: Agent, toTell: Info[], nextState?: () => BehaviorState) {
        super(nextState);
        this._targetAgent = targetAgent;
        this._toTell = toTell;
        if (ClientAPI.playerAgent.conversation) {
            if (Helper.getOthersInConversation[0] === this._targetAgent) {
                this.currentActionState = new TellInfoState(this._toTell.pop(), [], TellInfo.tellTransition);
            }
            else {
                this.currentActionState = new LeaveConersationState(TellInfo.leaveTransition);
            }
        }
        else {
            this.currentActionState = new RequestConversationState(this._targetAgent, TellInfo.requestConversationTransition);
        }
    }

    public async act() {
        TellInfo._activeInstance = this;
        this.currentActionState = await this.currentActionState.tick();
    }

    static leaveTransition(this: LeaveConersationState): ActionState {
        if (this.completed) {
            return new RequestConversationState(TellInfo.activeInstance._targetAgent, TellInfo.requestConversationTransition);
        }
        return this;
    }

    static requestConversationTransition(this: RequestConversationState): ActionState {
        if (this.completed) {
            PoliceKnowledgeBase.instance.requestedAgents.add(this.targetAgent);
            if (ClientAPI.playerAgent.conversation) {
                return new TellInfoState(TellInfo.activeInstance._toTell.pop(), [], TellInfo.tellTransition);
            }
        }
        if ((!this.completed && this.doneActing) || this.deltaTime > Helper.WAIT_FOR_OTHER) {
            return FailureAction.instance;
        }
        return this;
    }

    static tellTransition(this: TellInfoState): ActionState {
        if (this.completed) {
            if (TellInfo.activeInstance._toTell[0]) {
                return new TellInfoState(TellInfo.activeInstance._toTell.pop(), [], TellInfo.tellTransition);
            }
            else {
                return SuccessAction.instance;
            }
        }
        else if (this.doneActing) {
            return FailureAction.instance;
        }
        return this;
    }

    public nextState() {
        return this;
    }
}

class PolicePatrol extends BehaviorState {
    idleTimeRoom: number;
    private static _activeInstance: PolicePatrol;
    public static get activeInstance(): PolicePatrol {
        return this._activeInstance;
    }

    constructor(idleTimeRoom = 10000, nextState?: () => BehaviorState) {
        super(nextState);
        this.idleTimeRoom = idleTimeRoom;
        this.currentActionState = new IdleState(PolicePatrol.idleTransition);
    }

    public async act() {
        PolicePatrol._activeInstance = this;
        this.currentActionState = await this.currentActionState.tick();
    }

    static idleTransition(this: IdleState) {
        if (ClientAPI.playerAgent.conversationRequesters[0]) {
            return new AcceptConersationState(
            ClientAPI.playerAgent.conversationRequesters[0], PolicePatrol.acceptConversationTransition);
        }
        else if (Date.now() - this.startTime > PolicePatrol.activeInstance.idleTimeRoom) {
            let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
            if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
                potentialRooms = potentialRooms.filter(room => !room.roomTags.has("private"));
            }
            return new MoveState(
            potentialRooms[Helper.randomInt(0, potentialRooms.length)], PolicePatrol.moveTransition);
        }
        return this;
    }

    static acceptConversationTransition(this: AcceptConersationState) {
        if (this.completed) {
            return new ListenToOther(Helper.WAIT_FOR_OTHER, PolicePatrol.listenTransition);
        }
        else if (this.doneActing) {
            return new IdleState(PolicePatrol.idleTransition);
        }
        return this;
    }

    static listenTransition(this: ListenToOther) {
        if (Date.now() - this.lastUpdate > this.timeout) {
            return new LeaveConersationState(PolicePatrol.leaveTransition);
        }
        return this;
    }

    static leaveTransition(this: LeaveConersationState) {
        if (this.completed) {
            return new IdleState(PolicePatrol.idleTransition);
        }
        return this;
    }

    static moveTransition(this: MoveState) {
        if (this.doneActing) {
            if (this.completed) {
                PoliceKnowledgeBase.instance.requestedAgents.clear();
                PoliceKnowledgeBase.instance.conversedAgents.clear();
                return new IdleState(PolicePatrol.idleTransition);
            }
            return FailureAction.instance;
        }
        return this;
    }

    public nextState() {
        return this;
    }
}

class ListenToOther extends ActionState {
    other: Agent;
    timeout: number;
    lastUpdate: number;
    infoAboutOther = 0;

    constructor(timeout: number, nextState?: () => ActionState) {
        super(nextState);
        this.timeout = timeout;
        this.lastUpdate = Date.now();
        if (ClientAPI.playerAgent.conversation) {
            this.other = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
            this.infoAboutOther = ClientAPI.playerAgent.getInfoByAgent(this.other).length;
        }
    }

    public async act() {
        if (ClientAPI.playerAgent.conversation) {
            if (!this.other) this.other = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
            const currentInfo = ClientAPI.playerAgent.getInfoByAgent(this.other).length;
            if (this.infoAboutOther < currentInfo) {
                this.lastUpdate = Date.now();
                this.infoAboutOther = currentInfo;
            }
        }
    }

    public nextState() {
        if (Date.now() - this.lastUpdate > this.timeout) {
            return new LeaveConersationState();
        }
        return this;
    }
}

class PoliceArrestAgentState extends ActionState {
    private targetAgent: Agent;
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    private _doneActing = false;
    public get doneActing() {
        return this._doneActing;
    }

    constructor(targetAgent: Agent, nextState: () => ActionState = undefined) {
        super(nextState);
        this.targetAgent = targetAgent;
    }

    public async act() {
        if (ClientAPI.playerAgent.room.hasAgent(this.targetAgent)) {
            await ClientAPI.arrestAgent(this.targetAgent);
            this._completed = true;
            this._doneActing = true;
        }
        else {
            this._doneActing = true;
        }
    }

    public nextState(): ActionState {
        if (this._completed) return SuccessAction.instance;
        else if (this._doneActing) return FailureAction.instance;
        else return this;
    }
}

class PoliceNavigateToAgent extends BehaviorState {
    targetAgent: Agent;
    timeout: number;
    lastLocation: Room;
    visitedLastLocation = false;
    private static _activeInstance: PoliceNavigateToAgent;
    public static get activeInstance(): PoliceNavigateToAgent {
        return PoliceNavigateToAgent._activeInstance;
    }

    constructor(targetAgent: Agent, timeout = Infinity, nextState: () => BehaviorState = undefined) {
        super(nextState);
        this.targetAgent = targetAgent;
        this.timeout = timeout;
        this.lastLocation = Helper.findLastKnownLocation(this.targetAgent);
        this.currentActionState = new MoveState(this.lastLocation, PoliceNavigateToAgent.navigateTransition);
    }

    public async act() {
        PoliceNavigateToAgent._activeInstance = this;
        this.currentActionState = await this.currentActionState.tick();
    }

    public static navigateTransition(this: MoveState) {
        if (ClientAPI.playerAgent.room.hasAgent(PoliceNavigateToAgent.activeInstance.targetAgent)) {
            return SuccessAction.instance;
        }
        if (this.doneActing) {
            let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
            if (!PoliceNavigateToAgent.activeInstance.visitedLastLocation) {
                if (ClientAPI.playerAgent.room === PoliceNavigateToAgent.activeInstance.lastLocation) {
                    PoliceNavigateToAgent.activeInstance.visitedLastLocation = true;
                }
                else {
                    const dest = potentialRooms.find(room => room === PoliceNavigateToAgent.activeInstance.lastLocation);
                    if (dest) {
                        if (Helper.getPlayerRank(ClientAPI.playerAgent) <= 100 || !dest.roomTags.has("private")) {
                            return new MoveState(dest, PoliceNavigateToAgent.navigateTransition);
                        }
                    }
                }
            }
            if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
                potentialRooms = potentialRooms.filter(room => !room.roomTags.has("private"));
            }
            return new MoveState(potentialRooms[Helper.randomInt(0, potentialRooms.length)], PoliceNavigateToAgent.navigateTransition);
        }
        return this;
    }

    public nextState(): BehaviorState {
        return this;
    }
}

class PoliceNavigate extends BehaviorState {
    destName: string;
    timeout: number;
    completed = false;
    doneActing = false;
    private static _activeInstance: PoliceNavigate;
    public static get activeInstance(): PoliceNavigate {
        return PoliceNavigate._activeInstance;
    }

    constructor(dest: string, timeout = Infinity, nextState: () => BehaviorState = undefined) {
        super(nextState);
        this.destName = dest;
        this.timeout = timeout;
        this.currentActionState = new MoveState(ClientAPI.playerAgent.room, PoliceNavigate.navigateTransition);
    }

    public async act() {
        PoliceNavigate._activeInstance = this;
        this.currentActionState = await this.currentActionState.tick();
    }

    public static navigateTransition(this: MoveState) {
        if (this.doneActing) {
            if (PoliceNavigate.activeInstance.destName === this.destination.roomName) {
                PoliceNavigate.activeInstance.completed = true;
                PoliceNavigate.activeInstance.doneActing = true;
                return SuccessAction.instance;
            }
            else {
                let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
                const dest = potentialRooms.find(room => room.roomName === PoliceNavigate.activeInstance.destName);
                if (dest) {
                    if (Helper.getPlayerRank(ClientAPI.playerAgent) <= 100 || !dest.roomTags.has("private")) {
                        return new MoveState(dest, PoliceNavigate.navigateTransition);
                    }
                    else {
                        PoliceNavigate.activeInstance.doneActing = true;
                        return FailureAction.instance;
                    }
                }
                else {
                    if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
                        potentialRooms = potentialRooms.filter(room => !room.roomTags.has("private"));
                    }
                    return new MoveState(potentialRooms[Helper.randomInt(0, potentialRooms.length)], PoliceNavigate.navigateTransition);
                }
            }
        }
        return this;
    }

    public nextState(): BehaviorState {
        if (this.completed) {
            return SuccessBehavior.instance;
        }
        else if (this.deltaTime > this.timeout || this.doneActing) {
            return FailureBehavior.instance;
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
            if (ClientAPI.playerAgent.agentStatus.has("dead")) {
                return 0;
            }
            if (!err.message.includes("is already in a conversation!")) console.log(err);
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