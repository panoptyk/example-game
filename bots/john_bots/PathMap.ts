import { Agent, Room, ClientAPI } from "panoptyk-engine/dist/client";
import { RoomMap } from "../lib";

class PathMap {
    // Singleton Patten
    private static _instance: PathMap;

    public static get instance(): PathMap {
      if (!PathMap._instance) {
        PathMap._instance = new PathMap();
      }
      return PathMap._instance;
    }

    private agentMap: Map<Agent, [Path[], [Room, Room, number][]]> = new Map<Agent, [Path[], [Room, Room, number][]]>();

    public static dateToString(time: number): string {
        const date = new Date(time);
        const str = date.getMonth() +
            "-" +
            date.getDate() +
            "-" +
            (date.getFullYear() - 1900) +
            " " +
            date.getHours() +
            ":" +
            date.getMinutes();
        return str;
    }

    public addLocationTime(agent: Agent, from: Room, to: Room, time: number): void {
        if (!this.agentMap.has(agent)) {
            this.addAgent(agent, from, to, time);
        } else {
            if (this.checkPathExists(agent, from, to, time)) {
                return;
            }
            this.addPath(agent, new Path([[from, to, time]]));
            const temp: [Path[], [Room, Room, number][]] = this.agentMap.get(agent);
            this.agentMap.set(agent, [temp[0], temp[1].concat([[from, to, time]])]);
        }
        console.log ("Added location time - Agent: " + agent + " Moved From: " + from + " To: " + to + " At: " + PathMap.dateToString(time));
    }

    private checkPathExists(agent: Agent, from: Room, to: Room, time: number): boolean {
        const currentPaths: [Room, Room, number][] = this.agentMap.get(agent)[1];
        for (let i = 0; i < currentPaths.length; i++) {
            if (currentPaths[i][0] === from && currentPaths[i][1] === to && currentPaths[i][2] === time) {
                return true;
            }
        }
        return false;
    }

    private addPath(agent: Agent, newPath: Path): void {
        const path: Path[] = this.agentMap.get(agent)[0];
        const other: [Room, Room, number][] = this.agentMap.get(agent)[1];
        const fragments: Path[] = [];
        for (let i = 0; i < path.length; i++) {
            const result: Path[] = path[i].addToPath(newPath);
            if (result[0] !== undefined) {
                newPath = result[0];
                for (let j = 1; j < result.length; j++) {
                    fragments.push(result[j]);
                }
            } else {
                for (let j = 0; j < fragments.length; j++) {
                    this.addPath(agent, fragments[j]);
                }
                this.agentMap.set(agent, [path, other]);
                console.log("Pre-merge in");
                console.log(path);
                this.mergePath(agent);
                return;
            }
        }
        path.push(newPath);
        for (let j = 0; j < fragments.length; j++) {
            this.addPath(agent, fragments[j]);
        }
        this.agentMap.set(agent, [path, other]);
        console.log("Pre-merge out");
        console.log(path);
        this.mergePath(agent);
    }

    private mergePath (agent: Agent): void {
        const path: Path[] = this.agentMap.get(agent)[0];
        const other: [Room, Room, number][] = this.agentMap.get(agent)[1];
        if (path.length <= 1) {
            console.log("no-merge");
            return;
        }
        for (let i = path.length - 1; i >= 1; i--) {
            const result = path[i - 1].addToPath(path[i]);
            // console.log ("Adding");
            // console.log (path[i]);
            // console.log("to");
            // console.log(path[i - 1]);
            if (result[0] === undefined) {
                path.splice(i, 1);
            } else if (result[0].getFullPath() !== path[i].getFullPath()) {
                console.log ("Error in merge path");
                console.log ("Merge result: " + result[0].getFullPath());
                console.log ("Expected result: " + path[i].getFullPath());
            }
        }
        this.agentMap.set(agent, [path, other]);
        console.log("Post-merge");
        console.log(path);
    }

    public getLatestLocation (agent: Agent): Room {
        const path: Path[] = this.agentMap.get(agent)[0];
        return path[path.length - 1].getLatestLocation();
    }

    public getLocationAtTime (agent: Agent, time: number): Room {
        const path: Path[] = this.agentMap.get(agent)[0];
        let i = 0;
        let found = false;
        for (i = 0; i < path.length; i++) {
            if (time < path[i].getLatestTime()) {
                found = true;
                break;
            }
        }
        if (found) {
            return path[i].getLocationAtTime(time);
        }
        return this.getLatestLocation(agent);
    }

    public getTimesAtLocation(agent: Agent, room: Room): [number, number][] {
        const path: Path[] = this.agentMap.get(agent)[0];
        let times: [number, number][] = [];

        for (let i = 0; i < path.length; i++) {
            times = times.concat(path[i].getTimesAtLocation(room));
        }

        return times;
    }

    private addAgent(agent: Agent, from: Room, to: Room, time: number): void {
        if (!this.agentMap.has(agent)) {
            const path = new Path([[from, to, time]]);
            this.agentMap.set(agent, [[path], [[from, to, time]]]);
        }
    }

    public hasAgent(agent: Agent): boolean {
        return this.agentMap.has(agent);
    }

    public getAgentPathInfo (agent: Agent): Path[] {
        if (!this.agentMap.has(agent)) {
            return this.agentMap.get(agent)[0];
        }
        return undefined;
    }
}

class Path {

    constructor(path: [Room, Room, number][]) {
        this.path = path;
    }
    // constructor(path: [[Room, Room, number]], from: Room, to: Room, time: number) {
    //     this.path = [[from, to, time]];
    // }

    private path: [Room, Room, number][];

    public addToPath(newPath: Path): Path[] {
        let fullPath = newPath.getFullPath();
        const fragments: Path[] = [];
        if (fullPath[fullPath.length - 1][2] < this.path[0][2]) { // newPath is before this path
            if (fullPath[fullPath.length - 1][1] === this.path[0][0]) {
                this.path = this.path = fullPath.concat(this.path); // this path is a continuation of newPath
                return [undefined];
            } else {
                const oldPath = this.path;
                this.path = fullPath;
                return [new Path(oldPath)];
            }
        } else if (fullPath[0][2] > this.path[this.path.length - 1][2]) { // newPath is after this path
            if (fullPath[0][0] === this.path[this.path.length - 1][1]) {
                this.path = this.path.concat(fullPath); // newPath is a continuation of this path
                return [undefined];
            } else {
                return [newPath];
            }
        } else { // newPath comes somewhere inside of this path
            if (fullPath.length === 1) {
                for (let i = 0; i < this.path.length - 1; i++) {
                    if (fullPath[0][2] > this.path[i][2] && fullPath[0][2] < this.path[i + 1][2]) {
                        const pathEnd = this.path.splice(i + 1);
                        if (fullPath[0][0] === this.path[i][1]) {
                            this.path = this.path.concat(fullPath);
                            return [new Path(pathEnd)];
                        } else if (fullPath[0][1] === pathEnd[0][0]) {
                            fullPath = fullPath.concat(pathEnd);
                            return [new Path(fullPath)];
                        } else {
                            return [newPath, new Path(pathEnd)];
                        }
                    }
                }
            } else {
                for (let i = 0; i < fullPath.length; i++) {
                    fragments.push(new Path([fullPath[i]]));
                }
            }
        }
        if (fragments.length === 0) {
            fragments.push(undefined);
        }
        return fragments;
    }

    public getLatestLocation (): Room {
        return this.path[this.path.length - 1][1];
    }

    public getLatestTime (): number {
        return this.path[this.path.length - 1][2];
    }

    public getLocationAtTime (time: number): Room {
        let curTime: number = this.path[0][2];
        let i = 1;
        for (i = 1; i < this.path.length; i++) {
            if (this.path[i][2] < time) {
                curTime = this.path[i][2];
            } else {
                i--;
                break;
            }
        }
        return this.path[i][1];
    }

    public getTimesAtLocation(room: Room): [number, number][] {
        const times: [number, number][] = [];

        for (let i = 0; i < this.path.length; i++) {
            if (this.path[i][1] === room) {
                const time1 = this.path[i][2];
                let time2: number;
                if (i + 1 < this.path.length) {
                    time2 = this.path[i + 1][2];
                } else {
                    time2 = -1;
                }

                times.push([time1, time2]);
            } else {
                if (i === 0 && this.path[i][0] === room) {
                    times.push([-1, this.path[i][2]]);
                }
            }
        }

        return times;
    }

    public getFullPath(): [Room, Room, number][] {
        return this.path;
    }
}

export { PathMap };
export default PathMap.instance;