import { fork, ChildProcess } from "child_process";
let policeLeader: ChildProcess;
let crimeLeader: ChildProcess;
const policeMembers = [];
const crimeMembers = [];
const neutralMembers = [];
const childExecArgv = process.execArgv;
startScenario();


async function startScenario() {
    crimeLeader = fork("./bots/sean_bots/crime_scenario/crimeLeader.ts", ["Crime Leader", "password"], {execArgv: childExecArgv});
    policeLeader = fork("./bots/sean_bots/crime_scenario/police.ts", ["Police Leader", "password"], {execArgv: childExecArgv});
    await spawnPolice();
    await spawnNeutral();
    await spawnCrime();
}

async function spawnCrime() {
    const numCrime = 8;
    for (let i = 1; i <= numCrime; i++) {
        crimeMembers.push(fork(
        "./bots/sean_bots/crime_scenario/crimeGoon.ts",
        ["Goon " + i, "password"],
        {execArgv: childExecArgv}
        ));
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
    }
}

async function spawnPolice() {
    const numPolice = 3;
    for (let i = 1; i <= numPolice; i++) {
        policeMembers.push(fork(
        "./bots/sean_bots/crime_scenario/policeFsm.ts",
        ["Police " + i, "password"],
        {execArgv: childExecArgv}
        ));
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
    }
}

async function spawnNeutral() {
    const numPolice = 8;
    for (let i = 1; i <= numPolice; i++) {
        neutralMembers.push(fork(
        "./bots/sean_bots/crime_scenario/merchant.ts",
        ["Citizen " + i, "password"],
        {execArgv: childExecArgv}
        ));
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
    }
}