import { fork, ChildProcess } from "child_process";
const wanderingBartenders = [];
const goons = [];
let currentBartender: ChildProcess;
let faction1Leader: ChildProcess;
let quester: ChildProcess;
let lastQuestStart = 0;
const childExecArgv = process.execArgv;
startScenario();

function main() {
    // restart bartender if stuck
    if (Date.now() - lastQuestStart > 600000) {
        console.log("POTENTIAL STUCK BARTENDER!!");
        changeBartender();
    }
    // tslint:disable-next-line: ban
    setTimeout(main, 1000);
}

async function startScenario() {
    faction1Leader = fork("./bots/bartender_scenario/leader.ts", [], {execArgv: childExecArgv});
    quester = fork("./bots/bartender_scenario/quester.ts", [], {execArgv: childExecArgv});
    quester.on("message", changeBartender);
    await spawnBartenders();
    await spawnGoons();
    lastQuestStart = Date.now();
    main();
}

function changeBartender() {
    currentBartender.send("stand down");
    wanderingBartenders.push(currentBartender);
    currentBartender = wanderingBartenders.shift();
    currentBartender.send("begin quest");
    lastQuestStart = Date.now();
}

async function spawnBartenders() {
    for (let i = 1; i <= 4; i++) {
        const childProcess = fork("./bots/bartender_scenario/wanderingBartender.ts",
            ["Bartender " + i, "password"], {execArgv: childExecArgv});
        wanderingBartenders.push(childProcess);
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
    }
    currentBartender = wanderingBartenders.shift();
    currentBartender.send("begin quest");
}

async function spawnGoons() {
    const numBots = 6.0;
    for (let i = 1; i <= numBots; i++) {
        let zone: string;
        if (i / numBots <= 0.33) {
            zone = "bot";
        }
        else if (i / numBots <= 0.66) {
            zone = "mid";
        }
        else {
            zone = "top";
        }
        goons.push(fork("./bots/bartender_scenario/member.ts",
            ["Redshirt " + i, "password", zone], {execArgv: childExecArgv}));
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
    }
}
