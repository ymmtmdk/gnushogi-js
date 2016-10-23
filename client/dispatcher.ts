import {Store} from './store';
import {ActionTypes} from './actiontypes';
import * as Flux from 'flux';

const dispatcher = new Flux.Dispatcher<any>();

dispatcher.register(function(payload) {
  switch (payload.actionType) {
    case ActionTypes.KomaClick:
      return Store.komaClick(payload.koma);
    case ActionTypes.MasuClick:
      return Store.masuClick(payload.pos);
    case ActionTypes.PromSelect:
      return Store.promSelect(payload.isProm);
  }
});

export const Dispatcher = dispatcher;
