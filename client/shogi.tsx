"use strict";

import * as React from 'react';
import {render} from "react-dom";
import {Constants as C} from './constants';
import {ActionTypes} from './actiontypes';
import {EventTypes} from './eventtypes';
import {KomaData} from './komadata';
import {Role} from './role';
import {Store} from './store';
import {Dispatcher} from './dispatcher';
import {Position} from './position';

interface PromSelectProps {
  readonly koma: KomaData;
  readonly pos: Position;
}

class PromSelect extends React.Component<PromSelectProps, {}> {
  private promote(isProm: boolean) {
    return (e: React.MouseEvent)=>{
      Dispatcher.dispatch({
        actionType: ActionTypes.PromSelect,
        isProm: isProm,
      });
      e.stopPropagation();
    };
  }

  private style(isProm: boolean) {
    return {
      position: 'absolute',
      left: this.props.pos.off_x + (isProm ? 1 : -1) * C.MASU_W/2,
      top: this.props.pos.off_y,
      width: C.MASU_W,
      height: C.MASU_H,
      backgroundColor: "blue",
      opacity: 0.7,
    };
  }

  render(){
    const koma = this.props.koma;
    return (
      <div>
      <div onClick={this.promote(true)} style={this.style(true)}>
      <img src={Util.image_src(koma.role, koma.isWhite, true)} />
      </div>
      <div onClick={this.promote(false)} style={this.style(false)}>
      <img src={Util.image_src(koma.role, koma.isWhite, false)} />
      </div>
      </div>);
  }
}

interface KomaProps{
  readonly koma: KomaData;
  readonly pos: Position;
  readonly img: string;
}

class Koma extends React.Component<KomaProps, {}> {
  // readonly props;

  private style() {
    return {
      position: 'absolute',
      left: this.props.pos.off_x,
      top: this.props.pos.off_y,
      width: C.MASU_W,
      height: C.MASU_H,
      transitionProperty: 'left,top',
      transitionDuration: '0.3s',
      transitionTimingFunction: 'ease-out'
    };
  }

  onClick(e: React.MouseEvent): void {
    Dispatcher.dispatch({
      actionType: ActionTypes.KomaClick,
      koma: this.props.koma,
    });
    e.stopPropagation();
  }

  render() {
    return (
      <div onClick={this.onClick.bind(this)} style={this.style()}>
      <img src={this.props.img}/>
      </div>);
  }
}

interface TileProps{
  readonly pos: Position;
  readonly color: string;
}

class Tile extends React.Component<TileProps, {}> {
  private style() {
    return {
      position: 'absolute',
      left: this.props.pos.off_x,
      top: this.props.pos.off_y,
      width: C.MASU_W,
      height: C.MASU_H,
      backgroundColor: this.props.color,
    };
  }

  render() {
    return (
      <div style={this.style()}>
      </div>);
  }
}

interface BanState{
    komas: KomaData[];
    selected?: KomaData;
    promoting?: {koma: KomaData, pos:Position};
}

class Ban extends React.Component<{}, BanState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      komas: [],
      selected: undefined,
      promoting: undefined
    };
  }

  private events() {
    return [
      {name: EventTypes.Move, handler: this.setState.bind(this)},
      {name: EventTypes.Select, handler: this.setState.bind(this)},
      {name: EventTypes.Promote, handler: this.setState.bind(this)},
    ];
  }

  private style(){
    return {
      position: "absolute",
      left: "300px",
    };
  }

  componentDidMount() {
    this.events().forEach((o)=> Store.eventEmmiter.on(o.name, o.handler));
  }

  componentWillUnmount() {
    this.events().forEach((o)=> Store.eventEmmiter.removeListener(o.name, o.handler));
  }

  onClick(e: React.MouseEvent) {
    const rect = document.getElementById('ban')!.getBoundingClientRect();
    const left = rect.left + window.pageXOffset;
    const top = rect.top + window.pageYOffset;
    const pos = Position.from_offsets(e.pageX - left, e.pageY - top);
    Dispatcher.dispatch({
      actionType: ActionTypes.MasuClick,
      pos: pos,
    });
  }

  render() {
    const pos = (koma: KomaData)=>{
      if (koma.isHand){
        const o = Util.handsPos(this.state.komas, koma);
        if (koma.isWhite){
          return new Position(-1-o.x, o.y);
        } else{
          return new Position(11+o.x, 10-o.y);
        }
      } else{
        return koma.pos;
      }
    }

    const komas = this.state.komas.map((koma)=>(
      <Koma
      koma={koma}
      pos={pos(koma)}
      img={Util.image_src(koma.role, koma.isWhite, koma.isProm)}
      key={koma.id}/>
    ));

    const tile = this.state.selected
      ? (<Tile color="black" pos={pos(this.state.selected)}/>)
      : null;

      const prom = this.state.promoting
        ? (<PromSelect pos={this.state.promoting.pos} koma={this.state.promoting.koma}/>)
        : null;

        const abs = {position: "absolute"};
        return (
          <div id='ban' style={this.style()} onClick={this.onClick}>
          <img src='img/ban/ban_kaya_a.png' style={abs}/>
          <img src='img/masu/masu_nodot.png' style={abs}/>
          {tile}
          {komas}
          {prom}
          </div>);
  }
}

class Util{
  static image_src(role: Role, isWhite: boolean, isProm: boolean): string{
    const sg = isWhite ? 'go_' : 'sen_';
    const n = isProm ? 'nari_' : '';
    return `img/koma/${sg}${n}${role}.png`;
  }

  static handsPos(komas: KomaData[], koma:KomaData): {y:number,x:number}{
    const order = (role: Role)=>(
      ["ou", "hi", "kaku", "kin", "gin", "kei", "kyo", "fu"].findIndex((e)=>e==role)
    );

    const hand = komas.filter((km)=>(
      km.isHand && km.isWhite == koma.isWhite
    )).sort((a, b)=>(order(a.role) - order(b.role)));

    let y = 0;
    let x = 0;
    let currnetRole: string | undefined = undefined;
    hand.some((km)=>{
      if (currnetRole != km.role){
        y += 1;
        x = 0;
        currnetRole = km.role;
      }
      x += 1;
      return km.id == koma.id;
    });

    return {x: x, y: y};
  }
}

const main = ()=> {
  Store.start();
  render(<Ban />, document.getElementById("root")!);
}

document.addEventListener('DOMContentLoaded', main);
