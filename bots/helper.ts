import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI } from "panoptyk-engine/dist/";

export function UCS(start: Room, goal: Room) {
}

/**
 * Sleep for javascript
 * Note: Must be used in async function
 * Usage: await sleep(10);
 * @param ms time in milliseconds
 */
export function sleep(ms: number) {
    // tslint:disable-next-line: ban
    return new Promise(javascriptIsFun => setTimeout(javascriptIsFun, ms));
}

/**
 * Returns a random integer within [min, max)
 * @param min inclusive min
 * @param max exclusive max
 */
export function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Get other agents in agent's current conversation
 */
export function getOthersInConversation(): Agent[] {
    if (!ClientAPI.playerAgent.conversation) {
        return [];
    }
    return ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent);
}

/**
 * Gets the other agent in agent's current trade
 */
export function getOtherInTrade(): Agent {
    if (!ClientAPI.playerAgent.trade) {
        return undefined;
    }
    return ClientAPI.playerAgent === ClientAPI.playerAgent.trade.agentIni ?
    ClientAPI.playerAgent.trade.agentRec : ClientAPI.playerAgent.trade.agentIni;
}

/**
 * Gets other agents in agent's current room
 */
export function getOthersInRoom(): Agent[] {
    return ClientAPI.playerAgent.room.getAgents(ClientAPI.playerAgent);
}