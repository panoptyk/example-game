import { fork } from "child_process";
const faction1Leader = fork("./bots/bartender_scenario/leader.ts");
const bartender = fork("./bots/bartender_scenario/bartender.ts");
// spawn all patroling agents in with a slight delay to avoid overflowing room
spawnGoons();
async function spawnGoons() {
    const numBots = 6.0;
    for (let i = 0; i < numBots; i++) {
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
        const agent = fork("./bots/bartender_scenario/member.ts", ["Redshirt " + i, "password", zone]);
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 100));
    }
}
