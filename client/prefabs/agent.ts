import * as Assets from "../assets";

export class AgentSprite extends Phaser.Sprite {
  public lock = false;

  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, Assets.Spritesheets.SpritesheetsPlayerSpriteSheet484844.getName(), 0);

    this.animations.add("standing", [0, 1, 2], 3, true);
    this.animations.add("walk_forward", [9, 10, 11, 12], 4, true);
    this.animations.add("walking_side", [13, 14, 15, 16], 4, true);
    this.animations.add("walking_back", [17, 18, 19, 20], 4, true);
    this.animations.play("standing", 3, true);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
  }
}
