"use strict";

import {Constants as C} from './constants';
import {KomaData} from './komadata';
import {Role, RoleEn, RoleUtil} from './role';
import {p} from './p';

enum State{
  Init = 1,
  ReadingBd,
  CanMove,
  Moved,
  Waiting,
}

class Util{
  static perseRankStr(str: string): number {
    return parseInt(str, 10);
  };

  static perseFileStr(str: string): number {
    return str.charCodeAt(0) - "a".charCodeAt(0) + 1;
  };
}

class Hand{
  readonly isWhite: boolean;
  komas: KomaData[];

  constructor(isWhite: boolean){
    this.isWhite = isWhite;
    this.komas = [];
  }

  add(koma: KomaData): void {
    koma.isWhite = this.isWhite;
    koma.isHand = true;
    koma.isProm = false;
    koma.setPos(0, 0);
    this.komas.push(koma);
  }

  remove(role: Role): KomaData | undefined{
    for (let i = 0; i < this.komas.length; i++){
      if (this.komas[i].role == role){
        const koma = this.komas.splice(i, 1)[0];
        koma.isHand = false;
        return koma;
      }
    }
    return undefined;
  }
}

class Engine_{
  komas: KomaData[];
  private response: string;
  private readonly handWhite: Hand;
  private readonly handBlack: Hand;
  private state: State;
  private worker: Worker;

  constructor(){
    this.handWhite = new Hand(true);
    this.handBlack = new Hand(false);
    this.response = "";
    this.state = State.Init;
    this.worker = new Worker("gnushogi.js");
  }

  start(): void {
    this.send("bd", "bd");
    this.state = State.ReadingBd;
    this.worker.onmessage = (e)=>{
      if(e.data.stdout){
        this.interpret(e.data.stdout);
      }
    };
  }

  get(rank: number, file: number): KomaData | undefined{
    return this.komas.find((koma)=>{ return koma.pos.rank == rank && koma.pos.file == file });
  }

  canMove(): boolean {
    return this.state == State.CanMove;
  }

  move(koma: KomaData, rank: number, file: number, is_prom: boolean): void {
    if (!this.canMove()){
      return;
    }

    const yary = ["", "a", "b", "c", "d", "e", "f", "g", "h", "i"];
    let com = '';
    if (koma.isHand){
      com = RoleUtil.role2roleEn(koma.role).toUpperCase()+"*"+rank+yary[file];
    }else{
      com = koma.pos.rank + yary[koma.pos.file] + rank + yary[file];
      if (is_prom) {
        com += '+';
      }
    }
    this.send(com, 'move');
    this.state = State.Moved;
  }

  onUpdateHandler() {}

  private interpret(str: string) {
    let m: RegExpMatchArray | null;
    if (str.match(/^GNU Shogi /) || str === '\n') {
      return;
    }
    p(str);
    if (this.state === State.ReadingBd) {
      this.response += str;
      if (str.match(/^white/)) {
        this.komas = this.readBdResponse(this.response);
        this.response = "";
        this.state = State.CanMove;
        return this.onUpdateHandler();
      }
    } else if (this.state === State.Moved) {
      if (m = str.match(/\d\. (\d)(\w)(\d)(\w)(\+)? /)) {
        this.afterMove(m, false);
        this.state = State.Waiting;
      } else if (m = str.match(/\d\. (\w)\*(\d)(\w)(\+)? /)) {
        this.drop(m, false);
        this.state = State.Waiting;
      } else if (str.match(/Illegal move /)) {
        this.state = State.CanMove;
      }
      return this.onUpdateHandler();
    } else if (this.state == State.Waiting) {
      if (m = str.match(/\d\. \.\.\. (\d)(\w)(\d)(\w)(\+)? /)) {
        this.afterMove(m, true);
      } else if (m = str.match(/\d\. \.\.\. (\w)\*(\d)(\w)(\+)? /)) {
        this.drop(m, true);
      } else {
        p("error");
      }
      this.state = State.CanMove;
      return this.onUpdateHandler();
    }
  }

  private drop(m: RegExpMatchArray, isWhite: boolean): void {
    const rank = Util.perseRankStr(m[2]);
    const file = Util.perseFileStr(m[3]);
    const role = RoleUtil.roleEn2role(m[1].toLowerCase() as RoleEn);
    const hand = isWhite ? this.handWhite : this.handBlack;
    const koma = hand.remove(role);
    if (koma){
      koma.setPos(rank, file);
    }
  }

  private readBdResponse(res: string): KomaData[] {
    const komas: KomaData[] = [];
    const yary = res.split(/\n/);
    let id = 1;
    for (let y = 1; y <= C.FileSize; y++){
      const line = yary[y].replace(/\s/g, ' _').replace(/\+/g, ' +');
      const xary = line.split(/\s/);
      for (let x = 1; x <= C.RankSize; x++){
        const rolePart = xary[x];
        if (rolePart !== '_-') {
          const role = RoleUtil.roleEn2role(rolePart[1].toLowerCase() as RoleEn);
          const isWhite = !!rolePart.match(/[A-Z]/);
          const isProm = !!rolePart.match(/\+/);
          const koma = new KomaData(id, C.RankSize-x+1, y, role, isWhite, isProm, false);
          komas.push(koma);
          id += 1;
        }
      }
    }
    return komas;
  }

  private send(command: string, commandName: string): void {
    p(["send", command, commandName]);
    this.response = "";
    this.worker.postMessage({stdin: command + "\n"});
  }

  private afterMove(m: RegExpMatchArray, isWhite: boolean): void {
    const srcRank = Util.perseRankStr(m[1]);
    const srcFile = Util.perseFileStr(m[2]);
    const dstRank = Util.perseRankStr(m[3]);
    const dstFile = Util.perseFileStr(m[4]);
    const srcKoma = this.get(srcRank, srcFile);
    const dstKoma = this.get(dstRank, dstFile);
    if (dstKoma) {
      if (isWhite) {
        this.handWhite.add(dstKoma);
      } else {
        this.handBlack.add(dstKoma);
      }
    }
    if (srcKoma){
      srcKoma.setPos(dstRank, dstFile);
      if (m[5] === '+'){
        srcKoma.isProm = true;
      }
    }
  }
}

export const Engine = new Engine_();

