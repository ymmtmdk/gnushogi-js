import {Constants as C} from './constants';

export class Position{
  readonly off_x: number;
  readonly off_y: number;
  readonly rank: number;
  readonly file: number;

  constructor(rank: number, file: number){
    this.rank = rank;
    this.file = file;
    this.off_x = Position.rank2off_x(rank);
    this.off_y = Position.file2off_y(file);
  }

  static from_offsets(off_x: number, off_y: number){
    const rank = this.off_x2rank(off_x);
    const file = this.off_y2file(off_y);
    return new Position(rank, file);
  }

  static off_x2x(off_x: number){ return (off_x-C.BOARD_MERGIN) / C.MASU_W }
  static off_y2y(off_y: number){ return (off_y-C.BOARD_MERGIN) / C.MASU_H }
  static off_x2rank(off_x: number){ return C.RankSize - Math.floor(this.off_x2x(off_x)) }
  static off_y2file(off_y: number){ return Math.floor(this.off_y2y(off_y)) + 1 }
  static x2off_x(x: number){ return x*C.MASU_W+C.BOARD_MERGIN }
  static y2off_y(y: number){ return y*C.MASU_H+C.BOARD_MERGIN }
  static rank2off_x(rank: number){ return this.x2off_x(C.RankSize - rank) }
  static file2off_y(file: number){ return this.y2off_y(file - 1) }
}

