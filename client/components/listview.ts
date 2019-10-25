export class ListView {
   private game: Phaser.Game;
   private mask: Phaser.Graphics;
   private HUD: Phaser.Group;
   private items: Phaser.Group;
   private old: number;
   public width: number;
   public height: number;

   constructor(game: Phaser.Game) {
      this.game = game;

      this.width = 200;
      this.height = 400;
      const x = 0;
      const y = 0;

      this.HUD = this.game.add.group();
      this.HUD.position.set(x, y);

      // create mask
      this.mask = this.game.add.graphics(x, y, this.HUD);
      this.mask.beginFill(0xff0000).drawRect(x, y, this.width, this.height);
      this.mask.alpha = 0;
      this.HUD.mask = this.mask;

      // create background
      const rectangle = this.game.add.graphics(x, y, this.HUD);
      rectangle.beginFill(0x181238).drawRect(x, y, this.width, this.height);

      // create items group
      this.items = this.game.add.group(this.HUD);
      this.items.position.set(x, y + 16);

      // create header
      const style = { font: "16px Arial", fill: "#ffffff" };
      this.game.add.text(0, 0, "inventory", style, this.HUD);

      // add signals
      this.mask.inputEnabled = true;
      this.mask.events.onInputDown.add(this.onInputDown, this);
      this.mask.events.onInputUp.add(this.onInputUp, this);
   }

   private onInputDown(target: any, pointer: any): void {
      this.old = this.game.input.mousePointer.position.y;
      this.game.input.addMoveCallback(this.handleMove, this);
   }

   private onInputUp(target: any, pointer: any): void {
      this.game.input.deleteMoveCallback(this.handleMove, this);
   }

   private handleMove(pointer: any, x: number, y: number): void {
      const yDiff = this.old - y;
      const itemsX = this.items.position.x;
      const itemsY = this.items.position.y - yDiff;

      this.items.position.set(itemsX, itemsY);
      this.old = y;
   }

   public add(item: any) {
      const padding = 5;
      let y = 0;
      if (this.items.length !== 0) {
         const child = this.items.getChildAt(this.items.length - 1);
         y = child.position.y + (child as any).height + padding;
      }

      item.position.set(0, y);
      this.items.add(item);
   }

   public moveTo(x: number, y: number) {
      this.HUD.position.set(x, y);
   }
}