'use strict';
const centerAlign = require('center-align');
const clear = require('clear');

class Banner {

  show(projectName, version) {

    clear();
    console.log(centerAlign(`${projectName} v${version}`, 50));
    console.log(centerAlign('Copyright © 2018 Marcus Cemes', 50) + '\n');

  }

}

module.exports = Banner;