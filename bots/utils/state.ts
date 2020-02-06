import { Agent, Room, Info, Trade, Item, Conversation, Quest, Faction, IDObject, ClientAPI } from "panoptyk-engine/dist/";
import * as Helper from "./helper";

/**
 * A State must always return the resulting state after acting
 */
export interface State {
    act(): Promise<State>;
}

/**
 * Action States need to transition to a result state upon completion
 */
export abstract class ActionState implements State {
    protected _onSuccess: State;
    protected _onFailure: State;
    protected _timeout: number;
    protected _startTime: number;
    constructor(onSuccess: State, onFailure: State, timeout: number) {
        this._onSuccess = onSuccess;
        this._onFailure = onFailure;
        this._timeout = timeout;
        this._startTime = Date.now();
    }
    abstract act(): Promise<State>;
}

/**
 * Action State that attempts to move to targetAgent.
 */
export class MoveToAgent extends ActionState {
    private _targetAgent: Agent;
    private _lastLoc: Room;
    private _visitedLastLoc: boolean;
    constructor(targetAgent: Agent, onSuccess: State, onFailure?: State, timeout = Infinity) {
        super(onSuccess, onFailure, timeout);
        this._targetAgent = targetAgent;
    }
    public async act() {
        if (ClientAPI.playerAgent.room.hasAgent(this._targetAgent)) {
            return this._onSuccess;
        }
        else if (Date.now() - this._startTime > this._timeout) {
            return this._onFailure;
        }
        else {
            if (this._lastLoc === undefined) {
                this._lastLoc = Helper.findLastKnownLocation(this._targetAgent);
            }
            if (ClientAPI.playerAgent.room === this._lastLoc) {
                this._visitedLastLoc = true;
            }
            const nextDest = this._visitedLastLoc || this._lastLoc === undefined ? "random" : this._lastLoc.roomName;
            await Helper.dumbNavigateStep(nextDest);
        }
        return this;
    }
}

/**
 * ActionState that will attempt to start conversation with targetAgent.
 */
export class AttemptConversationWithAgent extends ActionState {
    private _targetAgent: Agent;
    private _leaveRoom: boolean;
    constructor(targetAgent: Agent, onSuccess: State, leaveRoom = true, onFailure?: State, timeout = Infinity) {
        super(onSuccess, onFailure, timeout);
        this._targetAgent = targetAgent;
        this._leaveRoom = leaveRoom;
    }
    public async act() {
        if (Date.now() - this._startTime > this._timeout) {
            return this._onFailure;
        }
        else if (ClientAPI.playerAgent.conversation) {
            const other: Agent = Helper.getOthersInConversation()[0];
            if (other === this._targetAgent) {
                return this._onSuccess;
            }
            else {
                await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
            }
        }
        else if (ClientAPI.playerAgent.room.hasAgent(this._targetAgent)) {
            if (!ClientAPI.playerAgent.activeConversationRequestTo(this._targetAgent)) {
                await ClientAPI.requestConversation(this._targetAgent);
            }
        }
        else {
            // target agent is not in room
            if (this._leaveRoom) {
                const adjustedTimeout = this._timeout - (Date.now() - this._startTime);
                return new MoveToAgent(this._targetAgent, this, this._onFailure, adjustedTimeout);
            }
        }
        return this;
    }
}

/**
 * ActionState that attempts to move to room with given name.
 */
export class MoveToRoom extends ActionState {
    private _roomName: string;
    constructor(roomName: string, onSuccess: State, onFailure?: State, timeout = Infinity) {
        super(onSuccess, onFailure, timeout);
        this._roomName = roomName;
    }
    public async act() {
        if (ClientAPI.playerAgent.room.roomName === this._roomName) {
            return this._onSuccess;
        }
        else if (Date.now() - this._startTime > this._timeout) {
            return this._onFailure;
        }
        else {
            await Helper.dumbNavigateStep(this._roomName);
        }
        return this;
    }
}