'use strict';
const logUpdate = require('log-update');
const elegantSpinner = require('elegant-spinner');
const chalk = require('chalk');
const figures = require('figures');

class TaskerWorker {

  constructor() {
    this.spin = elegantSpinner();
  }

  _render(task) {

    let buffer = ' '; // Indentation for each group
    if (!task.hide) {
      if (task.running) {
        buffer += chalk.cyan('{{__SPINNER__}}') + ' ';
      } else {
        if (task.complete === true) {
          buffer += chalk.green(figures.tick) + ' ';
        } else if (task.complete === false) {
          buffer += chalk.red(figures.cross) + ' ';
        } else {
          buffer += '  ';
        }
      }
      buffer += task.text;

      if (task.tasks) {
        for (let subtask of task.tasks) {
          buffer += '\n  ' + this._render(subtask);
        }
      }
    }
    return buffer;

  }


  /**
   * Render a Task object into a string.
   * Dynamic spinners will be replaced with {{\_\_SPINNER\_\_}} for
   * easy replacing in each frame
   * @param {*} task The Task
   * @param {*} spinner A elegant-spinner frame
   */
  render() {
    const frame = this.spin();
    // Replace spinners placeholder with new frame and write to stdout
    logUpdate(this.buffer.replace(new RegExp('{{__SPINNER__}}', 'g'), frame));
  }

  /** Process state into a string to avoid recalculations */
  setState(state) {
    let buffer = '';
    let firstLoop = true;
    for (let task of state) {
      if (firstLoop) {
        firstLoop = false;
      } else {
        buffer += '\n';
      }
      buffer += this._render(task);
    }
    this.buffer = buffer;
  }

  start() {
    this.interval = setInterval(this.render.bind(this), 120);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = false;
    this.buffer.replace(new RegExp('{{__SPINNER__}}', 'g'), ' '); // Remove spinners
    this.render();  // render a final frame
    logUpdate.done();
    process.send('stopped');
  }
}

const taskWorker = new TaskerWorker();

process.on('message', (msg) => {
  if (typeof msg === 'object') {
    taskWorker.setState(msg)
  } else {
    if (msg === 'start') {
      taskWorker.start();
    } else if (msg === 'stop') {
      taskWorker.stop();
    }
  }
});