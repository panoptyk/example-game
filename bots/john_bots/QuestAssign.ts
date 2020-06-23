import { Agent, Room, ClientAPI, Item, Info } from "panoptyk-engine/dist/client";

import * as KB from "./kb/KBadditions";

export enum QuestingStyles {
    FactionWide = "FAC_WIDE",
    IndividualProgress = "IND_PROG",
    IndividualRandom = "IND_RAND"
}

export enum GeneralQuestTypes {
    Crafting,
    Movement
}

class QuestAssign {

    // Singleton Patten
    private static _instance: QuestAssign;

    public static get instance(): QuestAssign {
      if (!QuestAssign._instance) {
        QuestAssign._instance = new QuestAssign();
      }
      return QuestAssign._instance;
    }

    private dummyInfo = {
        agents: [],
        items: [],
        locations: [],
        quantities: [],
        factions: []
    };

    private agents = [ 6, 3, 7 ];
    private rooms = [ 11, 5, 6, 7 ];

    private currentRoomGoal = 0;
    private roomTurnedIn = [0, 0, 0, 0];
    private roomInfoNeeded = [ 4, 4, 4, 4];

    private followInfoNeeded = 3;

    private crafting = [
        [
            [1, 2],
            [2, 2],
            [3]
        ],
        [
            [3, 2],
            [4, 3],
            [5, 1],
            [2]
        ]
    ];
    private currentCraftingGoal = 0;
    private currentItemGoal = 0;
    private craftingTurnedIn: [[number[], number][], number][] = [
        [[
            [[
                0,
                0
            ], 0]
        ], 0],
        [[
            [[
                0,
                0,
                0
            ], 0]
        ], 0]
    ];

    private questingStyle: QuestingStyles = QuestingStyles.IndividualProgress;
    private questType: GeneralQuestTypes = GeneralQuestTypes.Crafting;

    public get QuestingStyle(): QuestingStyles {
        return this.questingStyle;
    }

    private questMap: Map<Agent, Quest[]> = new Map<Agent, Quest[]>();

    public setStyle (style: QuestingStyles): void {
        this.questingStyle = style;
    }

    public setType (type: GeneralQuestTypes): void {
        this.questType = type;
    }

    public async assignQuest (agent: Agent) {
        // console.log (this.craftingTurnedIn[0][1] + ", " + this.craftingTurnedIn[1][1]);
        // console.log ("\t" + this.craftingTurnedIn[0][0]);
        // console.log ("\t" + this.craftingTurnedIn[1][0]);
        console.log (this.roomTurnedIn +  " out of " + this.roomInfoNeeded);
        if (!this.questMap.has(agent)) {
            this.questMap.set(agent, []);
            this.assignQuestChain(agent);
        } else if (this.questMap.get(agent).length <= 0) {
            this.assignQuestChain(agent);
        }

        const quest: Quest = this.questMap.get(agent).shift();
        await ClientAPI.giveQuest(
            agent,
            quest.Question,
            quest.Item,
            quest.Type,
            quest.Quantity,
            quest.RewardXP
        );
    }

    private assignQuestChain(agent: Agent): void {
        switch (this.questingStyle) {
            case QuestingStyles.FactionWide:
                this.createNewFactionWideQuestChain(agent);
                break;
            case QuestingStyles.IndividualProgress:
                this.createNewIndividualProgressQuestChain(agent);
                break;
            case QuestingStyles.IndividualRandom:
                this.createNewIndividualRandomQuestChain(agent);
                break;
        }
    }

    private createNewFactionWideQuestChain(agent: Agent): void {
        const quests: Quest[] = [];
        switch (this.questType) {
            case GeneralQuestTypes.Crafting:
                const randAmt = this.getRandomInt(1, this.crafting[this.currentCraftingGoal][this.currentItemGoal][1] + 1);
                quests.push(new Quest(
                    {},
                    Item.getByID(this.crafting[this.currentCraftingGoal][this.currentItemGoal][0]),
                    QuestType.item,
                    randAmt,
                    20));
                break;
            case GeneralQuestTypes.Movement:
                const terms = Info.ACTIONS.MOVE.getTerms(this.dummyInfo as Info);
                if (this.getRandomInt(0, 2)) {
                    terms.loc1 = { id: this.rooms[this.currentRoomGoal] } as Room;
                } else {
                    terms.loc2 = { id: this.rooms[this.currentRoomGoal] } as Room;
                }
                quests.push(new Quest(
                    terms,
                    { id: 0 } as Item,
                    QuestType.question,
                    1,
                    20
                ));
                break;
        }
        this.questMap.set(agent, quests);
    }

    private createNewIndividualProgressQuestChain(agent: Agent): void {
        const quests: Quest[] = [];
        switch (this.questType) {
            case GeneralQuestTypes.Crafting:
                const randSet = this.getRandomInt(0, this.crafting.length);
                for (let i = 0; i < this.crafting[randSet].length - 1; i++) {
                    quests.push(new Quest(
                        {},
                        Item.getByID(this.crafting[randSet][i][0]),
                        QuestType.item,
                        this.crafting[randSet][i][1],
                        20));
                }
                break;
            case GeneralQuestTypes.Movement:
                const terms = Info.ACTIONS.MOVE.getTerms(this.dummyInfo as Info);
                const randAgent = this.getRandomInt(0, this.agents.length);
                terms.agent = {id: this.agents[randAgent] } as Agent;
                for (let i = 0; i < this.followInfoNeeded; i++) {
                    quests.push(new Quest(
                        terms,
                        { id: 0 } as Item,
                        QuestType.question,
                        1,
                        20
                    ));
                }
                break;
        }
        this.questMap.set(agent, quests);
    }

    private createNewIndividualRandomQuestChain(agent: Agent): void {
        const quests: Quest[] = [];
        switch (this.questType) {
            case GeneralQuestTypes.Crafting:
                const randSet = this.getRandomInt(0, this.crafting.length);
                const randItem = this.getRandomInt(0, this.crafting[randSet].length);
                const randAmt = this.getRandomInt(1, this.crafting[randSet][randItem][1] + 1);
                quests.push(new Quest(
                    {},
                    Item.getByID(this.crafting[randSet][randItem][0]),
                    QuestType.item,
                    randAmt,
                    20));

                break;
            case GeneralQuestTypes.Movement:
                const terms = Info.ACTIONS.MOVE.getTerms(this.dummyInfo as Info);
                const randAgent = this.getRandomInt(0, this.agents.length + 1);
                if (randAgent < this.agents.length) {
                    terms.agent = {id: this.agents[randAgent] } as Agent;
                }
                const randLoc = this.getRandomInt(0, this.rooms.length);
                if (this.getRandomInt(0, 2)) {
                    terms.loc1 = { id: this.rooms[randLoc] } as Room;
                } else {
                    terms.loc2 = { id: this.rooms[randLoc] } as Room;
                }
                quests.push(new Quest(
                    terms,
                    { id: 0 } as Item,
                    QuestType.question,
                    1,
                    20
                ));
                break;
        }
        this.questMap.set(agent, quests);
    }

    private getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor((Math.random() * (max - min)) + min);
    }

    private markRecived(type: QuestType, item: Item, quantity: number, question: Info) {
        let enoughItems = false;
        let enoughSets = false;
        switch (type) {
            case QuestType.item:
                for (let i = 0; i < this.crafting.length; i++) {
                    for (let j = 0; j < this.crafting[i].length - 1; j++) {
                        if (item === Item.getByID(this.crafting[i][j][0])) {
                            this.craftingTurnedIn[i][0][0][0][j] += quantity; // Individual items
                            if (this.craftingTurnedIn[i][0][0][0][j] >= this.crafting[i][j][1] * this.crafting[i][this.crafting[i].length - 1][0]) {
                                enoughItems = true;
                                let setFinished = true;
                                for (let k = 0; k < this.crafting[i].length - 1; k++) {
                                    if (this.craftingTurnedIn[i][0][0][0][k] < this.crafting[i][k][1] * this.crafting[i][this.crafting[i].length - 1][0]) {
                                        setFinished = false;
                                        break;
                                    }
                                }
                                if (setFinished) {
                                    this.craftingTurnedIn[i][0][0][1] += this.crafting[i][this.crafting[i].length - 1][0]; // Enough items of all types for 1 set
                                    for (let k = 0; k < this.crafting[i].length - 1; k++) {
                                        this.craftingTurnedIn[i][0][0][0][k] -= this.crafting[i][k][1] * this.crafting[i][this.crafting[i].length - 1][0];
                                    }
                                    while (this.craftingTurnedIn[i][0][0][1] >= this.crafting[i][this.crafting[i].length - 1][0]) {
                                        enoughSets = true;
                                        this.craftingTurnedIn[i][1]++; // Reached set goal
                                        this.craftingTurnedIn[i][0][0][1] -= this.crafting[i][this.crafting[i].length - 1][0];
                                    }
                                }
                            }
                        }
                    }
                }
                if (enoughSets) {
                    this.currentCraftingGoal = this.getRandomInt(0, this.crafting.length);
                    this.currentItemGoal = 0;
                    enoughSets = false;
                    enoughItems = false;
                }
                if (enoughItems) {
                    this.currentItemGoal++;
                    enoughItems = false;
                    if (this.currentItemGoal > this.crafting[this.currentCraftingGoal].length - 1) {
                        console.log ("Error - passed end of valid items.");
                    }
                }
                break;
            case QuestType.question:
                if (this.questingStyle === QuestingStyles.FactionWide) {
                    const terms = question.getTerms();
                    let room = 0;
                    if (terms.loc1 !== undefined) {
                        room = terms.loc1.id;
                    } else {
                        room = terms.loc2.id;
                    }
                    console.log(room + " -> " + this.rooms.indexOf(room));
                    this.roomTurnedIn[this.rooms.indexOf(room)]++;
                    if (this.roomTurnedIn[this.currentRoomGoal] >= this.roomInfoNeeded [this.currentRoomGoal]) {
                        this.roomTurnedIn[this.currentRoomGoal] = 0;
                        this.currentRoomGoal = this.getRandomInt(0, this.rooms.length);
                        console.log("changed goal: " + this.currentRoomGoal);
                    }
                }
                break;
        }
    }


    // ========================================


    private checkOutstandingQuests(agent: Agent) {
        const maxQuest = 1;
        return KB.get.questGivenToAgent(agent) < maxQuest;
    }

    public canGiveQuest(agent: Agent) {
        if (
            !ClientAPI.playerAgent ||
            !ClientAPI.playerAgent.faction ||
            !agent ||
            !agent.faction
        ) {
            return false;
        }
        return (
            ClientAPI.playerAgent.faction.id === agent.faction.id &&
            this.checkOutstandingQuests(agent)
        );
    }


    public async tryCompleteQuest() {
        const quests = ClientAPI.playerAgent.activeGivenQuests;
        // let temp: Quest;
        for (const quest of quests) {
            if (quest.isComplete()) {
                this.markRecived(QuestType[quest.type], quest.item, quest.amount, quest.task);
                await ClientAPI.completeQuest(quest);
                break;
            }
        }
      }

}

enum QuestType {
    question = "question",
    item = "item"
}

class Quest {

    private question;
    public get Question() {
        return this.question;
    }

    private item: Item;
    public get Item(): Item {
        return this.item;
    }

    private type: QuestType;
    public get Type(): string {
        return this.type;
    }

    private quantity: number;
    public get Quantity(): number {
        return this.quantity;
    }

    private rewardXP: number;
    public get RewardXP(): number {
        return this.rewardXP;
    }

    constructor(question, iten: Item, type: QuestType, quantity, rewardXP) {
        this.question = question;
        this.item = iten;
        this.type = type;
        this.quantity = quantity;
        this.rewardXP = rewardXP;
    }
}




export { QuestAssign };
export default QuestAssign.instance;