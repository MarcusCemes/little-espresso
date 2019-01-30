'use strict';
const tasker = require('./tasker');
const execa = require('execa');
const figures = require('figures');
const chalk = require('chalk');

class MetadataReader {

  constructor(files) {
    this.files = files;
    this.state = {
      text: "Reading video metadata\n  " + this._bar(0, 1),
      running: true
    };
    this.tasker = new tasker(this.state);
  }

  async read() {

    this.tasker.start();

    const transcodeJobs = [];
    let failed = 0


    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      try {
        const { stdout, stderr } = await execa.shell(`ffprobe -v error -show_format -show_streams -print_format json "${file}"`);
        if (stderr.length === 0) {
          const json = JSON.parse(stdout);
          transcodeJobs.push({
            path: file,
            metadata: json
          });
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
      this.state.text = "Reading video metadata\n  " + this._bar(i + 1, this.files.length);
      this.tasker.setState(this.state);
    }


    this.state.text = "Video metadata read";
    this.state.running = false;
    this.state.complete = true;
    this.tasker.setState(this.state);
    await this.tasker.stop();
    this.tasker.destroy();

    if (failed > 0) {
      console.log(`  ${chalk.yellow(figures.warning)} ${failed} files are not valid video containers.`);
    }

    if (transcodeJobs.length === 0) {
      console.log(`${chalk.red('No files left to process.')}`);
      throw new Error('No files left to process');
    }

    return transcodeJobs;
  }



  _bar(value, total) {

    const percent = Math.min(value / total, 1);
    const width = 25;
    const n_filled = Math.floor(width * percent);
    const n_blank = width - n_filled;
    const filled = chalk.cyan('█'.repeat(n_filled));
    const blank = ' '.repeat(n_blank);

    return `|${filled}${blank}| ${Math.round(percent * 100)}%`;

  }

}

module.exports = MetadataReader;