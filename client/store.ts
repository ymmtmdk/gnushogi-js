"use strict";

import * as EventEmitter from 'events';
import {KomaData} from './komadata';
import {Engine} from './engine';
import {EventTypes} from './eventtypes';
import {Position} from './position';
import {p} from './p'

enum State {
  Normal = 1,
  Moving,
  Promoting,
}

class Store_ {
  readonly eventEmmiter: EventEmitter;
  onReadyHandler;
  private state: State;
  private selected: KomaData;
  private promotingPos: Position;

  constructor() {
    this.onUpdateHandler = this.onUpdateHandler.bind(this);
    this.eventEmmiter = new EventEmitter();
    this.selected = null;
    this.state = State.Normal;
  }

  start(): void {
    Engine.onUpdateHandler = this.onUpdateHandler;
    Engine.onReadyHandler = this.onReadyHandler;
    Engine.start();
  }

  private toNormal(){
    this.selected = null;
    this.promotingPos = null;
    this.eventEmmiter.emit(EventTypes.Select, { selected: null });
    this.eventEmmiter.emit(EventTypes.Promote, { promoting: null });
    this.state = State.Normal;
  }

  private onMoving(pos): void {
    if (this.selected.canPromote(pos.file)) {
      this.promotingPos = new Position(pos.rank, pos.file);
      this.eventEmmiter.emit(EventTypes.Promote, { promoting: {koma: this.selected, pos: this.promotingPos}});
      this.state = State.Promoting;
    } else {
      Engine.move(this.selected, pos.rank, pos.file, false);
      this.toNormal();
    }
  }

  komaClick(koma): void {
    if (!Engine.canMove()){
      return;
    }

    if (this.state === State.Normal) {
      if (!koma.isWhite) {
        this.selected = koma;
        this.eventEmmiter.emit(EventTypes.Select, { selected: koma });
        this.state = State.Moving;
      }
    } else if (this.state === State.Moving) {
      this.onMoving(koma.pos);
    } else if (this.state === State.Promoting) {
      this.toNormal();
    }
  }

  masuClick(pos): void {
    if (this.state === State.Moving) {
      this.onMoving(pos);
    } else if (this.state === State.Promoting) {
      this.toNormal();
    }
  }

  promSelect(koma, isProm): void {
    if (this.state === State.Promoting) {
      Engine.move(this.selected, this.promotingPos.rank, this.promotingPos.file, isProm);
    }
    this.toNormal();
  }

  onUpdateHandler(): void {
    this.eventEmmiter.emit(EventTypes.Move, { komas: Engine.komas });
  }
}

export const Store = new Store_();

