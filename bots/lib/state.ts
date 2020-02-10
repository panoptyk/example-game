export abstract class State {

    readonly startTime: number = 0;
    private lastTickTime = 0;
    private thisTickTime = 0;
    private _deltaTime = 0;
    /**
     * Time in ms since tick last called
     */
    public get deltaTime() {
        return this._deltaTime;
    }

    constructor(nextState: () => State = undefined) {
        this.startTime = Date.now();
        this.thisTickTime = this.startTime;
        if (nextState) {
            this.nextState = nextState;
        }
    }

    /**
     * tick is called to both have a state perform its logic and return the state to transition to
     */
    public async tick(): Promise<State> {
        this.calcDeltaTime();
        await this.act();
        return this.nextState();
    }

    public async abstract act ();

    public abstract nextState(): State;

    private calcDeltaTime() {
        this.lastTickTime = this.thisTickTime;
        this.thisTickTime = Date.now();
        this._deltaTime = Math.max(this.thisTickTime - this.lastTickTime, 0);
    }

  }