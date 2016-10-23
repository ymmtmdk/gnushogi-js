import {Position} from './position';

export class DebugUtil{
  debugMove() {
    let wait = 500;

    const click = (rank: number, file: number)=>{
      setTimeout(()=>{
        const evt = document.createEvent("MouseEvents");
        const rect = document.getElementById('ban')!.getBoundingClientRect();
        const left = rect.left + window.pageXOffset;
        const top = rect.top + window.pageYOffset;
        const clientX = left + Position.rank2off_x(rank);
        const clientY = top + Position.file2off_y(file);

        evt.initMouseEvent("click", true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null as any);
        const elm = document.elementFromPoint(clientX, clientY);
        elm.dispatchEvent(evt);
      }, wait);
      wait += 400;
    }

    click(6, 7);
    click(6, 6);
    click(6, 6);
    click(6, 5);
    click(6, 5);
    click(6, 4);
    click(6, 4);
    click(6, 3);
    click(2, 8);
    click(6, 8);
    click(6, 8);
    click(6, 4);
    click(6, 4);
    click(6, 3);
    click(1, 1);
    click(7, 7);
    click(7, 6);
    click(8, 8);
    click(4, 4);
    click(7, 6);
    click(7, 5);
  }
}
