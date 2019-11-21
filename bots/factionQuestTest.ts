import { fork } from "child_process";
const faction1Leader = fork("./bots/faction1-leader.ts");
const quester = fork("./bots/quester.ts");
