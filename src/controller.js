const Worker = require("./ar.worker.js");
const {Engine} = require('./engine.js');

class Controller {
  constructor(options) {
    this.useworker = options.useworker !== undefined? options.useworker: true;
    if (!this.useworker) {
      return;
    }

    this.projectionMatrix = null;

    this.worker = new Worker();
    this.subscribers = {};
    this.worker.onmessage = (e) => {
      const {data} = e;
      const {type} = data;
      if (this.subscribers[type]) {
        this.subscribers[type](e);
      }
    }
  }

  setup(inputWidth, inputHeight) {
    if (!this.useworker) {
      this.engine = new Engine(inputWidth, inputHeight);
      this.projectionMatrix = this.engine.getProjectionMatrix();
      return;
    }

    this.worker.postMessage({type: 'setup', options: {inputWidth, inputHeight}});

    return new Promise((resolve, reject) => {
      this.subscribers['setupDone'] = (e) => {
        this.projectionMatrix = e.data.projectionMatrix;
        resolve();
      };
    });
  }

  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  addImageTarget(options) {
    if (!this.useworker) {
      this.engine.addImageTarget(options);
      return;
    }

    this.worker.postMessage({type: 'addImageTarget', options});

    return new Promise((resolve, reject) => {
      this.subscribers['addImageTargetDone'] = () => {
        resolve();
      };
    });
  }

  process(queryImage) {
    if (!this.useworker) {
      return this.engine.process(queryImage);
    }

    this.worker.postMessage({type: 'process', options: {queryImage: queryImage}});

    return new Promise((resolve, reject) => {
      this.subscribers['processDone'] = (e) => {
        // console.log("process done result: ", e);
        const result = e.data.result;
        resolve(result);
      };
    });
  }

}

module.exports = {
  Controller,
}