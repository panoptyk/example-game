import { ActionState } from "../../lib/ActionStates/actionState";
import { Item, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class OfferItemTradeState extends ActionState {
  _items: Item[];
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }

  constructor(items: Item[], nextState: () => ActionState = undefined) {
    super(nextState);
    this._items = items;
  }

  public async act() {
    if (ClientAPI.playerAgent.trade) {
      await ClientAPI.offerItemsTrade(this._items)
        .catch((res: ValidationResult) => {
          console.log(res.message);
        })
        .then(() => {
          this._completed = true;
          this._doneActing = true;
        });
    } else {
      this._doneActing = true;
    }
  }

  public nextState(): ActionState {
    if (this._completed) return SuccessAction.instance;
    else if (this._doneActing) return FailureAction.instance;
    else return this;
  }
}
