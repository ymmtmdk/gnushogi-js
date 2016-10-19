"use strict";

import * as React from 'react';
import {render} from "react-dom";
import {Constants as C} from './constants';
import {ActionTypes} from './actiontypes';
import {EventTypes} from './eventtypes';
import {KomaData} from './komadata';
import {Store} from './store';
import {Dispatcher} from './dispatcher';
import {Position} from './position';

class PromSelect extends React.Component<{}, {}> {
  readonly props;

  private promote(isProm) {
    return (e)=>{
      Dispatcher.dispatch({
        actionType: ActionTypes.PromSelect,
        koma: this.props.koma,
        isProm: isProm,
      });
      e.stopPropagation();
    };
  }

  private style(isProm) {
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

class Koma extends React.Component<{}, {}> {
  readonly props;

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

  onClick(e) {
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

class Tile extends React.Component<{}, {}> {
  readonly props;

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

class Ban extends React.Component<{}, {}> {
  readonly props;
  state: {komas: KomaData[]
    selected: KomaData,
    promoting: {koma: KomaData, pos:Position},
  };

  constructor(props) {
    super(props);
    this.state = {
      komas: [],
      selected: null,
      promoting: null
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

  onClick(e) {
    const rect = document.getElementById('ban').getBoundingClientRect();
    const left = rect.left + window.pageXOffset;
    const top = rect.top + window.pageYOffset;
    const pos = Position.from_offsets(e.pageX - left, e.pageY - top);
    Dispatcher.dispatch({
      actionType: ActionTypes.MasuClick,
      pos: pos,
    });
  }

  render() {
    const handsPosWhite = Util.handsPos(this.state.komas, true);
    const handsPosBlack = Util.handsPos(this.state.komas, false);
    const pos = (koma: KomaData)=>{
      if (koma.isHand){
        if (koma.isWhite){
          const o = handsPosWhite[koma.id];
          return new Position(-1-o.x, o.y);
        } else{
          const o = handsPosBlack[koma.id];
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
  static image_src(role, isWhite, isProm): string{
    const sg = isWhite ? 'go_' : 'sen_';
    const n = isProm ? 'nari_' : '';
    return `img/koma/${sg}${n}${role}.png`;
  }

  static handsPos(komas, isWhite){
    const order = (role)=>(
      ["ou", "hi", "kaku", "kin", "gin", "kei", "kyo", "fu"].findIndex((e)=>e==role)
    );

    const hand = komas.filter((koma)=>(
      koma.isHand && koma.isWhite == isWhite
    )).sort((a, b)=>(order(a.role) < order(b.role)));

    let pos = {};
    let roleIdx = {};
    let idx = 0;
    hand.forEach((koma)=>{
      if (!roleIdx[koma.role]){
        roleIdx[koma.role] = 0;
        idx += 1;
      }
      roleIdx[koma.role] += 1;
      pos[koma.id] = {y: idx, x: roleIdx[koma.role]};
    });

    return pos;
  }
}

const main = ()=> {
  Store.onReadyHandler = ()=>{
    render(<Ban />, document.getElementById("root"));
  };
  Store.start();
}

main();
