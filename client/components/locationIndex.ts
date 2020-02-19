interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class LocationIndex {
  private total: number;
  private locs: Phaser.Point[];
  private possible: number[];
  private all: number[];
  private tileW: number;
  private tileH: number;

  constructor(areas: Area[], tileWidth: number, tileHeight: number) {
    this.total = 0;
    this.tileW = tileWidth;
    this.tileH = tileHeight;
    this.locs = [];
    this.all = [];
    areas.forEach(area => {
      this.addLocs(area);
    });
    this.resetPossible();
  }

  public resetPossible() {
    this.possible = undefined;
    this.possible = this.all.slice(0);
  }

  public addLocs(area: Area) {
    for (let y = 0; y < area.height; y += this.tileH) {
      for (let x = 0; x < area.width; x += this.tileW) {
        this.all.push(this.total++);
        this.locs.push(new Phaser.Point(area.x + x, area.y + y));
      }
    }
  }

  public getRandomLoc(): { pos: Phaser.Point; index: number } {
    if (this.possible.length === 0) {
      return { index: 0, pos: this.locs[0] };
    }
    const choice = Math.floor(Math.random() * this.possible.length);
    const index = this.possible[choice];
    this.possible.splice(choice, 1);
    return {
        index,
        pos: this.locs[index]
    };
  }

  public getLocByIndex(index: number): Phaser.Point {
      return this.locs[index];
  }

  public releaseIndex(index: number) {
    this.possible.push(index);
  }
}
