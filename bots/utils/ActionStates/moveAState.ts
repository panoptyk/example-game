import { ActionState } from "../../lib/ActionStates/actionState";
import { Room, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib";

export class MoveState extends ActionState {
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    private _doneActing = false;
    public get doneActing() {
        return this._doneActing;
    }
    private _destination: Room;
    public get destination(): Room {
        return this._destination;
    }

    constructor(destination: Room, nextState: () => ActionState = undefined) {
        super(nextState);
        this._destination = destination;
    }

    public async act() {
        if (ClientAPI.playerAgent.room.getAdjacentRooms().includes(this._destination)) {
            await ClientAPI.moveToRoom(this._destination)
            .catch((res: ValidationResult) => {
                console.log(res.message);
            })
            .then(() => {
                this._completed = true;
                this._doneActing = true;
            });
        }
        else {
            this._doneActing = true;
        }
    }

    public nextState(): ActionState {
        if (this._completed) return SuccessAction.instance;
        else if (this._doneActing) return FailureAction.instance;
        else return this;
    }
}
