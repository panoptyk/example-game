import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../../utils/helper";

const username = process.argv.length >= 3 ? process.argv[2] : "James Bond";
const password = process.argv.length > 3 ? process.argv[3] : "password";
const HOME_ID = 1;
let acting = false;
let state = "wait";
const markedAgents = new Set<Agent>();
// conversation related variables
let conUpdate: number;
let prevInfoLen: number;
let asked = false;
let traded = false;
// quest related variables
let activeQuest: Quest;
const exploredInfo = new Set<Info>();
let currentTarget: Agent;
let questState: string;
let solution: Info;
let lastLoc: Room;
let visitedLastLoc = false;
let roomUpdate: number;
const requestedAgents = new Set<Agent>();

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
    setTimeout(main, Helper.randomInt(100, 200));
}

function prepForConversation() {
    conUpdate = 0;
    prevInfoLen = 0;
    asked = false;
    traded = false;
}

function clearRoomData() {
    roomUpdate = 0;
    requestedAgents.clear();
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    if (state === "wait") {
        if (ClientAPI.playerAgent.room.id !== HOME_ID && !ClientAPI.playerAgent.inConversation()) {
            await dumbNavigateStep(HOME_ID);
        }
        else {
            await waitHandler();
        }
    }
    else if (state === "check") {
        if (ClientAPI.playerAgent.inConversation()) {
            await leaderConversation();
        }
        else {
            state = ClientAPI.playerAgent.activeAssignedQuests.length ? "quest" : "wait";
        }
    }
    else if (state === "quest") {
        await questHandler();
    }
}

/**
 * this should eventually be replaced by a real navigation algorithm
 */
async function dumbNavigateStep(roomID: number) {
    if (ClientAPI.playerAgent.room.id !== roomID) {
        const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(room => room.id === roomID);
        if (dest) await ClientAPI.moveToRoom(dest);
        else await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
        clearRoomData();
    }
}

async function leaderConversation() {
    const other: Agent = Helper.getOthersInConversation()[0];
    conUpdate = conUpdate ? conUpdate : Date.now();
    prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length;

    // give other agent time to interact and extend timer when they tell us something
    const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
    if (Date.now() - conUpdate <= Helper.WAIT_FOR_OTHER || prevInfoLen < infoLen) {
        if (prevInfoLen < infoLen) {
            prevInfoLen = infoLen;
            conUpdate = Date.now();
        }
    }
    else {
        console.log(username + " leaving conversation with " + other + " due to inactivity");
        await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
    }
}

async function waitHandler() {
    // accept conversations from approaching agents if they are a high ranking member in same faction
    for (const requester of ClientAPI.playerAgent.conversationRequesters) {
        if (Helper.getPlayerRank(requester) === 0 && requester.faction === ClientAPI.playerAgent.faction) {
            prepForConversation();
            await ClientAPI.acceptConversation(requester);
            state = "check";
            return;
        }
        else {
            await ClientAPI.rejectConversation(requester);
        }
    }
}

/**
 * Assumes that agent is not in current room
 * @param agent
 */
async function navigateToAgentStep(agent: Agent) {
    if (lastLoc === undefined) {
        lastLoc = Helper.findLastKnownLocation(agent);
    }
    if (ClientAPI.playerAgent.room === lastLoc) {
        visitedLastLoc = true;
    }
    const nextDest = visitedLastLoc || lastLoc === undefined ? 0 : lastLoc.id;
    await dumbNavigateStep(nextDest);
}

async function completeQuest() {
    if (ClientAPI.playerAgent.inConversation()) {
        await ClientAPI.completeQuest(activeQuest, solution);
        console.log(ClientAPI.playerAgent + ": Quest complete " + activeQuest);
        process.send("quest complete");
        activeQuest = undefined;
        state = "check";
    }
    else if (ClientAPI.playerAgent.room.hasAgent(activeQuest.giver)) {
        if (!ClientAPI.playerAgent.activeConversationRequestTo(activeQuest.giver)) {
            console.log(ClientAPI.playerAgent + ": Requesting quest giver: " + activeQuest.giver);
            prepForConversation();
            await ClientAPI.requestConversation(activeQuest.giver);
        }
    }
    else {
        // attempt to navigate to agent
        await navigateToAgentStep(activeQuest.giver);
    }
}

async function questQuestionConversation() {
    if (ClientAPI.playerAgent.trade) {
        traded = true;
        const trade: Trade = ClientAPI.playerAgent.trade;
        const other: Agent = Helper.getOtherInTrade();
        // offer whatever we need to get info
        if (trade.agentOfferedAnswer(other, activeQuest.task)) {
            for (const [item, response] of trade.getAgentsRequestedItems(other)) {
                if (!trade.agentOfferedItem(ClientAPI.playerAgent, item) && ClientAPI.playerAgent.hasItem(item)) {
                    await ClientAPI.offerItemsTrade([item]);
                }
            }
            // TODO: add feature to process gold/resource requests
            // temp fix to offer gold by default
            if (trade.getAgentsOfferedGold(ClientAPI.playerAgent) < 1) {
                await ClientAPI.addGoldToTrade(1);
            }
            if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
                conUpdate = Date.now();
                await ClientAPI.setTradeReadyStatus(true);
                return;
            }
        }
    }
    else if (ClientAPI.playerAgent.inConversation() && !traded) {
        const convo: Conversation = ClientAPI.playerAgent.conversation;
        const other: Agent = Helper.getOthersInConversation()[0];
        markedAgents.add(other);
        conUpdate = conUpdate ? conUpdate : Date.now();
        prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length;
        if (!asked) {
            await ClientAPI.askQuestion(activeQuest.task.getTerms());
            asked = true;
            return;
        }
        const tradeReq = ClientAPI.playerAgent.tradeRequesters;
        if (tradeReq.length > 0) {
            await ClientAPI.acceptTrade(other);
            conUpdate = Date.now();
            return;
        }
        // give other agent time to interact and extend timer when they tell us something
        const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
        if (Date.now() - conUpdate <= Helper.WAIT_FOR_OTHER || prevInfoLen < infoLen) {
            if (prevInfoLen < infoLen) {
                prevInfoLen = infoLen;
                conUpdate = Date.now();
            }
        }
        else {
            console.log(username + " leaving conversation with " + other + " due to inactivity");
            await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
        }
    }
    // revaluate after either trading or waiting for too long in conversation
    else {
        console.log(ClientAPI.playerAgent + ": Finished talking to " + currentTarget);
        questState = "evaluating";
        currentTarget = undefined;
        lastLoc = undefined;
        visitedLastLoc = false;
    }
}

async function validateConversationState() {
    const other = Helper.getOthersInConversation()[0];
    if ((questState === "blindSearching" && markedAgents.has(other)) ||
    (questState === "searching" && other !== currentTarget)) {
        await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
    }
    else {
        prepForConversation();
        questState = "talking";
    }
}

async function questQuestionSolver() {
    if (questState === "evaluating") {
        // Check if we have obtained answer
        const potentialAns = ClientAPI.playerAgent.getInfoByAction(activeQuest.task.action);
        for (const info of potentialAns) {
            if (activeQuest.checkSatisfiability(info)) {
                console.log(ClientAPI.playerAgent + ": Turning in quest " + activeQuest);
                questState = "turnIn";
                solution = info;
                return;
            }
        }
        // find a lead
        for (const told of ClientAPI.playerAgent.getInfoByAction("TOLD")) {
            const terms = told.getTerms();
            const toldInfo: Info = terms.info; // The contents of the information that was told
            if (!exploredInfo.has(told) && !markedAgents.has(terms.agent1) &&
            !(terms.agent1 === ClientAPI.playerAgent || terms.agent2 === ClientAPI.playerAgent)
            && toldInfo.isAnswer(activeQuest.task)) {
                exploredInfo.add(told);
                markedAgents.add(terms.agent1);
                currentTarget = terms.agent1;
                questState = "searching";
                console.log(ClientAPI.playerAgent + ": Looking for " + currentTarget);
                return;
            }
        }

        // randomly search if there are no leads
        if (currentTarget === undefined) {
            questState = "blindSearching";
            console.log(ClientAPI.playerAgent + ": No leads, blindly asking random agents");
        }
    }
    else if (questState === "turnIn") {
        await completeQuest();
    }
    else if (questState === "talking") {
        await questQuestionConversation();
    }
    else if (questState === "searching") {
        if (ClientAPI.playerAgent.inConversation()) {
            await validateConversationState();
        }
        // attempt to reach and start conversation with target
        else if (ClientAPI.playerAgent.room.hasAgent(currentTarget)) {
            if (!ClientAPI.playerAgent.activeConversationRequestTo(currentTarget)) {
                await ClientAPI.requestConversation(currentTarget);
            }
        }
        else {
            // attempt to navigate to agent
            await navigateToAgentStep(currentTarget);
        }
    }
    else if (questState === "blindSearching") {
        if (!roomUpdate) roomUpdate = Date.now();
        if (ClientAPI.playerAgent.inConversation()) {
            await validateConversationState();
        }
        // accept conversations from anyone as they may be helpful
        // TODO: add some way to ignore spam/troll requests
        else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
            await ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]);
        }
        else {
            // attempt conversation with any valid agent
            for (const agent of Helper.getOthersInRoom()) {
                if (!markedAgents.has(agent) && !requestedAgents.has(agent) && !agent.inConversation()) {
                    await ClientAPI.requestConversation(agent);
                    requestedAgents.add(agent);
                    roomUpdate = Date.now();
                    return;
                }
            }
            // leave room if we do not get a conversation in a certain amount of time
            if (Date.now() - roomUpdate >= Helper.WAIT_FOR_OTHER) {
                await dumbNavigateStep(0);
            }
        }
    }
}

async function questHandler() {
    if (activeQuest === undefined) {
        markedAgents.clear();
        exploredInfo.clear();
        questState = "evaluating";
        currentTarget = undefined;
        lastLoc = undefined;
        visitedLastLoc = false;
        solution = undefined;
        activeQuest = ClientAPI.playerAgent.activeAssignedQuests[0];
        console.log(ClientAPI.playerAgent + ": Starting Quest " + activeQuest);
    }
    if (activeQuest.type === "question") {
        await questQuestionSolver();
    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();