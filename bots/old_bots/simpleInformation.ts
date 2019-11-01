import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, getPanoptykDatetime } from "panoptyk-engine/dist/";

const username = process.argv.length >= 3 ? process.argv[2] : "simpleTrader";
const password = process.argv.length > 3 ? process.argv[3] : "password";

let lastMove: number;
let currentRoom: Room;

async function leaveRoom() {
    const adjacents = ClientAPI.playerAgent.room.getAdjacentRooms();
    const next = Math.floor(Math.random() * Math.floor(adjacents.length));
    await ClientAPI.moveToRoom(adjacents[next]).then(res => {
        lastMove = getPanoptykDatetime();
        currentRoom = ClientAPI.playerAgent.room;
    }).catch(err => {
        console.log(err.message);
    });
}

async function sendRequests() {
    for (const other of currentRoom.occupants) {
        if (other.id !== ClientAPI.playerAgent.id) {
            await ClientAPI.requestConversation(other).catch(err => {
                console.log(err.message);
            });
        }
    }
}

async function informationTrade() {
    while (ClientAPI.playerAgent.inConversation()) {
        const trades: Trade[] = Trade.getActiveTradesWithAgent(ClientAPI.playerAgent);
        if (trades.length > 0) {
            if (username === "info1") {
                await ClientAPI.setTradeReadyStatus(trades[0], true).catch(err => {
                    console.log(err.message);
                });
            }
            if (username === "info2") {
                for (const info of ClientAPI.playerAgent.knowledge) {
                    if (info.isQuery()) {
                        // answer question
                    }
                }
            }
        }
        else {
            // attempt to start trade with anyone in conversation
            for (const agent of ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)) {
                await ClientAPI.requestTrade(agent).catch(err => {
                    console.log(err.message);
                });
            }
        }
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 1000));
    }
}

async function conversationQuestionTest() {
    while (true) {
        if (username === "info1") {
            const other = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
            const pred = Info.ACTIONS.MOVE.question({agent: other, time: undefined, loc1: undefined, loc2: ClientAPI.playerAgent.room});
            await ClientAPI.askQuestion(pred).catch(err => {
                console.log(err.message);
            });
            return;
        }
        if (username === "info2") {
            for (const info of ClientAPI.playerAgent.knowledge) {
                if (info.isQuery()) {
                    // await ClientAPI.confirmKnowledgeOfAnswerToQuestion(info).catch(err => {
                    //     console.log(err.message);
                    // });
                    return;
                }
            }
        }
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 1000));
    }
}

async function main() {
    let waitAmount: number;
    while (true) {
        if (!ClientAPI.playerAgent.inConversation() &&
            ClientAPI.playerAgent.conversationRequesters.length === 0) {
                waitAmount = currentRoom.occupants.length > 1 ? 10000 : 5000;
                await sendRequests();
        }
        else if (ClientAPI.playerAgent.inConversation()) {
            console.log("yay conversation!!", ClientAPI.playerAgent.conversation);
            await conversationQuestionTest();
            await informationTrade();
        }
        else {
            await ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]).catch(err => {
                console.log(err.message);
            });
            // skip rest of loop since we now have a conversation
            continue;
        }
        if (getPanoptykDatetime() - lastMove > waitAmount) {
            await leaveRoom();
        }

        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
    }
}

async function init() {
    ClientAPI.init();
    await ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
    }).catch(err => {
        throw new Error("Login fail!");
    });
    lastMove = getPanoptykDatetime();
    currentRoom = ClientAPI.playerAgent.room;
    main();
}

init();