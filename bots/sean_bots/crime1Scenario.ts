import { fork, ChildProcess } from "child_process";
const merchantNames = ["Lyla", "Shannon", "Leopold", "Maxwell"];
const policeNames = ["Jason", "Jack", "Charleane", "Kelly"];
let policeLeader: ChildProcess;
let crimeLeader: ChildProcess;
const numCrime = 8;
let crimeIdx = 1;
const numPolice = 4;
const numNeutral = 4;
const policeMembers = [];
const crimeMembers = [];
const neutralMembers = [];
const childExecArgv = process.execArgv;
startScenario();

async function startScenario() {
  crimeLeader = fork(
    "./bots/sean_bots/crime_scenario/crimeLeader.ts",
    ["Cornelius Cornwall", "password"],
    { execArgv: childExecArgv }
  );
  policeLeader = fork(
    "./bots/sean_bots/crime_scenario/policeLeader.ts",
    ["Elizabeth Alexandra Mary Windsor", "password"],
    { execArgv: childExecArgv }
  );
  await spawnPolice();
  // await spawnCrime();
  await spawnNeutral();
}

function spawnNewCrimeGoon() {
  crimeIdx++;
  const newGoon = fork(
    "./bots/sean_bots/crime_scenario/crimeGoon.ts",
    ["Goon " + crimeIdx, "password"],
    { execArgv: childExecArgv }
  );
  newGoon.on("message", m => {
    spawnNewCrimeGoon();
  });
  crimeMembers.push(newGoon);
}

async function spawnCrime() {
  while (crimeIdx <= numCrime) {
    spawnNewCrimeGoon();
    // tslint:disable-next-line: ban
    await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
  }
}

async function spawnPolice() {
  for (let i = 1; i <= numPolice; i++) {
    policeMembers.push(
      fork(
        "./bots/sean_bots/crime_scenario/policeInformant.ts",
        [policeNames[i - 1], "password"],
        { execArgv: childExecArgv }
      )
    );
    // tslint:disable-next-line: ban
    await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
  }
}

async function spawnNeutral() {
  for (let i = 1; i <= numNeutral; i++) {
    neutralMembers.push(
      fork(
        "./bots/sean_bots/crime_scenario/merchant.ts",
        [merchantNames[i - 1], "password"],
        { execArgv: childExecArgv }
      )
    );
    // tslint:disable-next-line: ban
    await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
  }
}
