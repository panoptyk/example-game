import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../../utils/helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let state = "wait";
const markedAgents = new Set<Agent>();
// conversation related variables
let conUpdate: number;
let prevInfoLen: number;
let asked = false;
let traded = false;
const answeredQuestions = new Set<Info>();
// patrol related variables
const talked = new Set<Agent>();
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
    setTimeout(main, 100);
}

function prepForConversation() {
    conUpdate = 0;
    prevInfoLen = 0;
    asked = false;
    traded = false;
    answeredQuestions.clear();
}

function clearRoomData() {
    requestedAgents.clear();
    roomUpdate = Date.now();
    talked.clear();
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    if (state === "idle") {
        if (ClientAPI.playerAgent.conversation) {
            prepForConversation();
            state = "idleConversation";
            await patrolConversationHandler();
        }
        else {
            await patrolHandler();
        }
    }
    else if (state === "idleConversation") {
        if (ClientAPI.playerAgent.conversation) {
            await patrolConversationHandler();
        }
        else {
            state = ClientAPI.playerAgent.activeAssignedQuests.length ? "quest" : "idle";
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

///////////////////////////////////////////// Functions for Idle behavior //////////////////////////////////////

function hasNewInfoToTell(other: Agent): boolean {
    for (const cinfo of ClientAPI.playerAgent.knowledge) {
        // temporary fix to avoid spamming too much info
        if (cinfo.action === "MOVE" || cinfo.action === "TOLD" || cinfo.action === "CONVERSE") {
            continue;
        }
        // tell other agent everything we know that we have not already told to them or been told by them
        const hasTold = ClientAPI.playerAgent.getInfoByAction("TOLD").find(told =>
            told.getTerms().info.equals(cinfo) && (told.getTerms().agent1 === other ||
            told.getTerms().agent2 === other));
        if (!hasTold) {
           return true;
        }
    }
    return false;
}

async function patrolConversationHandler() {
    const conv: Conversation = ClientAPI.playerAgent.conversation;
    requestedAgents.clear(); // we clear our memory of requested conversations here because requests are cancelled when convo starts
    const other: Agent = Helper.getOthersInConversation()[0];
    conUpdate = conUpdate ? conUpdate : Date.now(); // last time convo was updated with something
    prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length; // last amount of info we had from/about other agent
    if (other.faction === ClientAPI.playerAgent.faction) {
        // answer any questions that allied agent asks
        for (const question of conv.askedQuestions) {
            if (!answeredQuestions.has(question)) {
                console.log(username + " received question: " + question);
                const relatedInfo: Info[] = Helper.getAllRelatedInfo(question);
                for (const rInfo of relatedInfo) {
                    console.log(username + " telling answer: " + rInfo);
                    await ClientAPI.tellInfo(rInfo);
                }
                answeredQuestions.add(question);
            }
        }
        // tell allied agent any new info
        if (!talked.has(other)) {
            for (const cinfo of ClientAPI.playerAgent.knowledge) {
                // temporary fix to avoid spamming too much info
                if (cinfo.action === "MOVE" || cinfo.action === "TOLD" || cinfo.action === "CONVERSE") {
                    continue;
                }
                // tell other agent everything we know that we have not already told to them or been told by them
                const hasTold = ClientAPI.playerAgent.getInfoByAction("TOLD").find(told =>
                    told.getTerms().info.equals(cinfo) && (told.getTerms().agent1 === other ||
                    told.getTerms().agent2 === other));
                if (!hasTold) {
                    await ClientAPI.tellInfo(cinfo);
                }
            }
        }
    }
    talked.add(other);
    // give other agent time to interact and extend timer when they tell us something
    const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
    if (Date.now() - conUpdate <= Helper.WAIT_FOR_OTHER || prevInfoLen < infoLen) {
        if (prevInfoLen < infoLen) {
            prevInfoLen = infoLen;
            conUpdate = Date.now();
        }
    }
    else {
        // console.log(username + " leaving conversation with " + other + " due to inactivity");
        await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
    }
}

async function patrolHandler() {
    // accept conversations from approaching agents if we havent already talked to them in this room
    for (const requester of ClientAPI.playerAgent.conversationRequesters) {
        if (!talked.has(requester)) {
            await ClientAPI.acceptConversation(requester);
            roomUpdate = Date.now();
            return;
        }
        else {
            await ClientAPI.rejectConversation(requester);
        }
    }
    // attempt to start conversations with suitable agents
    let done = true;
    for (const other of Helper.getOthersInRoom()) {
        if (other.faction === ClientAPI.playerAgent.faction &&
        !requestedAgents.has(other) && !talked.has(other) && !other.inConversation()) {
            // only request conversation if we have new info to tell agent
            const needToTell: boolean = hasNewInfoToTell(other);
            if (needToTell) {
                await ClientAPI.requestConversation(other);
            }
            roomUpdate = Date.now();
            requestedAgents.add(other);
            return;
        }
        // delay leaving room as long as we have active conversation requests that have not been rejected
        else if (!talked.has(other) && ClientAPI.playerAgent.activeConversationRequestTo(other)) done = false;
    }
    // continue patrol if there is no one left to interact with
    if (done || Date.now() - roomUpdate > Helper.WAIT_FOR_OTHER) {
        await dumbNavigateStep(0);
    }
}

/////////////////////////////////////// Functions for Quest behavior //////////////////////////////////////


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
    if (ClientAPI.playerAgent.inConversation() && Helper.getOthersInConversation()[0] === activeQuest.giver) {
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
        solution = getSolution();
        if (solution) {
            console.log(ClientAPI.playerAgent + ": Turning in quest " + activeQuest);
            questState = "turnIn";
            return;
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

function getSolution(): Info {
    // Check if we have fufilled quest conditions
    const potentialAns = ClientAPI.playerAgent.getInfoByAction(activeQuest.task.action);
    for (const info of potentialAns) {
        if (activeQuest.checkSatisfiability(info)) {
            return info;
        }
    }
    return undefined;
}

function policePresent() {
    for (const agent of ClientAPI.playerAgent.room.occupants) {
        if (agent.faction.factionType === "police") {
            return true;
        }
    }
    return false;
}

async function questItemSteal(questItem: Item) {
    // TODO use information reasoning instead at some point
    if (questItem.room) {
        if (ClientAPI.playerAgent.room === questItem.room) {
            // try not to pickup when item is illegal and police are around
            if (questItem.itemTags.has("illegal") && !policePresent) {
                await ClientAPI.takeItems([questItem]);
            }
        }
        else {
            await dumbNavigateStep(questItem.room.id);
        }
    }
    else if (questItem.agent) {
        if (ClientAPI.playerAgent.room.hasAgent(questItem.agent)) {
            await ClientAPI.stealItem(questItem.agent, questItem);
            questState = "evaluating";
        }
        else {
            await navigateToAgentStep(questItem.agent);
        }
    }
}

async function questGiveItem() {
    const item: Item = activeQuest.task.getTerms().item;
    switch (questState) {
        case "evaluating": {
            solution = getSolution();
            if (solution) {
                console.log(ClientAPI.playerAgent + ": Turning in quest " + activeQuest);
                questState = "turnIn";
            }
            else if (ClientAPI.playerAgent.hasItem(item)) {
                questState = "giveItem";
                currentTarget = activeQuest.task.getTerms().agent2;
            }
            else {
                questState = "acquireItem";
            }
            break;
        }
        case "turnIn": {
            await completeQuest();
            break;
        }
        case "giveItem": {
            if (ClientAPI.playerAgent.conversation) {
                const other: Agent = Helper.getOthersInConversation()[0];
                if (other !== currentTarget) {
                    await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
                }
                else if (ClientAPI.playerAgent.trade) {
                    if (!ClientAPI.playerAgent.trade.agentOfferedItem(ClientAPI.playerAgent, item)) {
                        await ClientAPI.offerItemsTrade([item]);
                    }
                    await ClientAPI.setTradeReadyStatus(true);
                }
                else {
                    if (ClientAPI.playerAgent.hasItem(item)) {
                        if (!ClientAPI.playerAgent.activeTradeRequestTo(other)) await ClientAPI.requestTrade(other);
                    }
                    else {
                        await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
                        questState = "evaluating";
                    }
                }
            }
            else if (ClientAPI.playerAgent.room.hasAgent(currentTarget)) {
                if (!ClientAPI.playerAgent.activeConversationRequestTo(currentTarget) &&
                !currentTarget.conversation) {
                    await ClientAPI.requestConversation(currentTarget);
                }
            }
            else {
                await navigateToAgentStep(currentTarget);
            }
            break;
        }
        case "acquireItem": {
            await questItemSteal(item);
            break;
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
    else if (activeQuest.type === "command" && activeQuest.task.action === "GAVE") {
        // item acquisition
        await questGiveItem();
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