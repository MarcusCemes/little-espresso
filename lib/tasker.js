'use strict';
const cluster = require('cluster');
const path = require('path');

 class Tasker {

  constructor(state) {
    this.state = typeof state === 'object' ? [state] : state;
    this.active = false;
  }

  start() {
    if (!this.active) {
      cluster.setupMaster({
        exec: path.join(__dirname, '/tasker_worker.js') // This format is used to explicitly declare an asset for PKG
      });
      this.worker = cluster.fork();
      this.worker.send(this.state);
      this.active = true;
    }
    this.worker.send('start');
  }

  stop() {
    return new Promise(res => {
      if (this.active) {
        cluster.once('message', (worker, msg) => {
          if (msg === 'stopped')
            res();
        });
        this.worker.send('stop');
      } else {
        res();
      }
    });
  }

  destroy() {
    cluster.disconnect();
  }

  setState(state) {
    if (this.active) {
      this.state = typeof state === 'object' ? [state] : state; // Wrap with array
      this.worker.send(this.state);
    }
  }

 }

 module.exports = Tasker;