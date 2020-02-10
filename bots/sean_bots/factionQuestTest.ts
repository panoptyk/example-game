import { fork } from "child_process";
const faction1Leader = fork("./bots/simple_quest_test/faction1-leader.ts");
const quester = fork("./bots/simple_quest_test/quester.ts");
