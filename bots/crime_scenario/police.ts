import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, Faction, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let state: string;
// police variables
const criminals = new Set<Agent>();
let infoIdx = 0;

/**
 * this should eventually be replaced by a real navigation algorithm
 */
async function policeNavigateStep(roomID: number) {
    if (ClientAPI.playerAgent.room.id !== roomID) {
        const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms().filter(room => !room.roomTags.has("private"));
        const dest = potentialRooms.find(room => room.id === roomID);
        if (dest) await ClientAPI.moveToRoom(dest);
        else await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
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
    setTimeout(main, Helper.randomInt(100, 200));
}

function detectCrime() {
    const knowledge = ClientAPI.playerAgent.knowledge;
    for (let i = infoIdx; i < knowledge.length; i++) {
        const info = knowledge[i];
        const terms = info.getTerms();
        const item: Item = terms.item;
        switch (info.action) {
            case "STOLE":
                criminals.add(terms.agent1);
                /* falls through */
            case "GAVE":
                if (item.itemTags.has("illegal")) {
                    criminals.add(terms.agent1);
                    criminals.add(terms.agent2);
                }
                break;
            case "PICKUP":
                if (item.itemTags.has("illegal")) {
                    criminals.add(terms.agent);
                }
                break;
        }
    }
    infoIdx = knowledge.length;
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    detectCrime();
    switch (state) {

    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        if (Helper.getPlayerRank(ClientAPI.playerAgent) === 0) {
            state = "lead";
        }
        else {
            state = "patrol";
        }
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();