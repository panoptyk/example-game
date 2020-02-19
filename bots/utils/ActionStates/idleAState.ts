import { ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { ActionState } from "../../lib/ActionStates/actionState";

export class IdleState extends ActionState {
    public async act() {
        return;
    }

    public nextState() {
        return this;
    }
}