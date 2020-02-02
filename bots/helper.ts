import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI } from "panoptyk-engine/dist/";

/**
 * Variable that I use in my bots to determine time to wait for input from other agents.
 */
export const WAIT_FOR_OTHER = 1000;

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

/**
 * Gets the last known location of agent based on current knowledge
 * @param agent
 */
export function findLastKnownLocation(agent: Agent): Room {
    const agentInfo = ClientAPI.playerAgent.getInfoByAgent(agent);
    let time = 0;
    let location = undefined;
    for (const info of agentInfo) {
        const terms = info.getTerms();
        if (terms.time > time && terms.loc !== undefined) {
            location = terms.loc;
            time = terms.time;
        }
    }
    return location;
}

/**
 * Returns all information possibly related to targetInfo
 * @param targetInfo
 */
export function getAllRelatedInfo(targetInfo: Info): Info[] {
    const relatedInfo = [];
    for (const info of ClientAPI.playerAgent.knowledge) {
        const terms = info.getTerms();
        if (info.isAnswer(targetInfo) ||
        terms.info !== undefined && terms.info.isAnswer(targetInfo)) {
            relatedInfo.push(info);
        }
    }
    return relatedInfo;
}

/**
 * Returns info that agent has offered in given trade.
 * TODO: maybe convert to agent's local ref copy
 * @param trade
 */
export function getMyOfferedInfo(trade: Trade): Info[] {
    return ClientAPI.playerAgent === trade.agentIni ? trade.infoAnsIni : trade.infoAnsRec;
}

/**
 * Returns an agent's numeric rank or undefined if they are not in a faction or their rank is unknown
 * @param agent
 */
export function getPlayerRank(agent: Agent): number {
    if (agent.faction) {
        return agent.faction.getAgentRank(agent);
    }
    return undefined;
}