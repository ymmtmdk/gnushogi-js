"use strict";

import {Constants as C} from './constants';
import {KomaData} from './komadata';
import {p} from './p';

enum State{
  Init = 1,
  ReadingBd,
  CanMove,
  Moved,
  Waiting,
}

class Util{
  static perseRankStr(str) {
    return parseInt(str, 10);
  };

  static perseFileStr(str) {
    return str.charCodeAt(0) - "a".charCodeAt(0) + 1;
  };
}

class Hand{
  readonly isWhite: boolean;
  komas: KomaData[];

  constructor(isWhite){
    this.isWhite = isWhite;
    this.komas = [];
  }

  add(koma: KomaData): void{
    koma.isWhite = this.isWhite;
    koma.isHand = true;
    koma.isProm = false;
    koma.setPos(0, 0);
    this.komas.push(koma);
  }

  remove(role): KomaData{
    for (let i = 0; i < this.komas.length; i++){
      if (this.komas[i].role == role){
        const koma = this.komas.splice(i, 1)[0];
        koma.isHand = false;
        return koma;
      }
    }
    return null;
  }
}

class Engine_{
  komas: KomaData[];
  private response: string;
  private readonly handWhite: Hand;
  private readonly handBlack: Hand;
  private state: State;
  worker;

  constructor(){
    this.handWhite = new Hand(true);
    this.handBlack = new Hand(false);
    this.response = "";
    this.state = State.Init;
    this.worker = new Worker("gnushogi.js");
  }

  start(): void {
    this.worker.onmessage = (e)=>{
      // p(e.data);
      if (e.data.ready){
        this.send("bd", "bd");
        this.state = State.ReadingBd;
      }
      else if(e.data.stdout){
        this.interpret(e.data.stdout);
      }
    };
  }

  get(rank, file): KomaData {
    return this.komas.find((koma)=>{ return koma.pos.rank == rank && koma.pos.file == file });
  }

  canMove(): boolean {
    return this.state == State.CanMove;
  }

  move(koma, rank, file, is_prom): void {
    if (!this.canMove()){
      return;
    }

    const yary = ["", "a", "b", "c", "d", "e", "f", "g", "h", "i"];
    let com = '';
    if (koma.isHand){
      com = this.roleMapRev(koma.role).toUpperCase()+"*"+rank+yary[file];
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
  onReadyHandler() {}

  private interpret(str) {
    let m;
    if (str.match(/^GNU Shogi /) || str === '\n') {
      return;
    }
    p(str);
    if (this.state === State.ReadingBd) {
      this.response += str;
      if (str.match(/^white/)) {
        this.komas = this.readBdResponse(this.response);
        this.response = "";
        this.onReadyHandler();
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

  private drop(m, isWhite): void {
    const rank = Util.perseRankStr(m[2]);
    const file = Util.perseFileStr(m[3]);
    const role = this.roleMap(m[1]);
    const hand = isWhite ? this.handWhite : this.handBlack;
    const koma = hand.remove(role);
    koma.setPos(rank, file);
  }

  private readBdResponse(res): KomaData[] {
    const komas = [];
    const yary = res.split(/\n/);
    let id = 1;
    for (let y = 1; y <= C.FileSize; y++){
      const line = yary[y].replace(/\s/g, ' _').replace(/\+/g, ' +');
      const xary = line.split(/\s/);
      for (let x = 1; x <= C.RankSize; x++){
        const role = xary[x];
        if (role !== '_-') {
          const isWhite = !!role.match(/[A-Z]/);
          const isProm = !!role.match(/\+/);
          const koma = new KomaData(id, C.RankSize-x+1, y, this.roleMap(role[1]), isWhite, isProm, false);
          komas.push(koma);
          id += 1;
        }
      }
    }
    return komas;
  }

  private send(command, commandName): void {
    p(["send", command, commandName]);
    this.response = "";
    this.worker.postMessage(command + "\n");
  }

  private afterMove(m, isWhite): void {
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
    srcKoma.setPos(dstRank, dstFile);
    if (m[5] === '+'){
      srcKoma.isProm = true;
    }
  }

  private roleMap(role): string{
    const map = {
      k: "ou",
      r: "hi",
      b: "kaku",
      g: "kin",
      s: "gin",
      n: "kei",
      l: "kyo",
      p: "fu",
    };
    return map[role.toLowerCase()];
  }

  private roleMapRev(role): string{
    const map = {
      ou: "k",
      hi: "r",
      kaku: "b",
      kin: "g",
      gin: "s",
      kei: "n",
      kyo: "l",
      fu: "p",
    };
    return map[role.toLowerCase()];
  }
}

export const Engine = new Engine_();

