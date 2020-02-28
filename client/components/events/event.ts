import Game from "../../states/game";

export abstract class Event {
  GS: Game;
  constructor(game: Game) {
    this.GS = game;
  }
  abstract canProcess(): boolean;
  abstract process();
}
