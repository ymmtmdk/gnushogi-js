import {Position} from './position';
import {Role} from './role';

export class KomaData{
  readonly id: number;
  readonly role: Role;
  isWhite: boolean;
  isProm: boolean;
  isHand: boolean;
  pos: Position;

  constructor(id: number, rank: number, file: number, role: Role, isWhite: boolean, isProm: boolean, isHand: boolean) {
    this.id = id;
    this.role = role;
    this.isWhite = isWhite;
    this.isProm = isProm;
    this.isHand = isHand;
    this.pos = new Position(rank, file);
  }

  canPromote(file: number): boolean {
    if (this.isProm || this.isHand || this.role === 'ou' || this.role === 'kin') {
      return false;
    }
    if (this.isWhite) {
      return this.pos.file >= 7 || file >= 7;
    } else {
      return this.pos.file <= 3 || file <= 3;
    }
  }

  setPos(rank: number, file: number): void {
    this.pos = new Position(rank, file);
  }
}

