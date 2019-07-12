'use strict';
const metadataReader = require('./metadata_reader');
const prompts = require('./prompts');
const tasker = require('./tasker');
const processVideo = require('././process_video');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const figures = require('figures');

const EXPORTS_FOLDER = 'exports/';

class Transcode {

  constructor(raw_files, program) {
    this.raw_files = raw_files;
    this.program = program;
    this.state = {
      text: "Spinning up the fans",
      running: true
    };
    this.tasker = new tasker(this.state);
  }

  async run() {

    // Read metadata
    const mr = new metadataReader(this.raw_files);
    this.transcodeJobs = await mr.read();

    // Read parameters, complete transcode jobs
    const pr = new prompts(this.program);
    this.options = await pr.ask();
    this.transcodeJobs = await pr.fill(this.transcodeJobs, this.options);

    const exportsFolder = path.resolve(path.join(process.cwd(), EXPORTS_FOLDER));
    if (fs.existsSync(exportsFolder) && fs.readdirSync(exportsFolder).length > 0) {
      const overwritePermission = this.program.force || (await pr.getOverwritePermission()).overwrite_permission;
      if (!overwritePermission) {
        console.log(chalk.red('Exports folder is not empty.'))
        throw new Error('Exports folder is not empty');
      }
      fs.emptyDirSync(exportsFolder);
    } else {
      fs.ensureDirSync(exportsFolder);
    }

    process.stdout.write("\n");
    this.tasker.start();

    const efficiencies = [];
    const pv = new processVideo(this.tasker, this.options, exportsFolder, this.transcodeJobs.length, this.program);

    // Effect...
    await new Promise(res => setTimeout(res, 1000));

    for (let i = 0; i < this.transcodeJobs.length; i++) {

      const result = await pv.process(this.transcodeJobs[i], i);
      if (result && result.efficiency) efficiencies.push(result.efficiency);

    }


    const totalEfficiency = efficiencies.length > 0 ? ` - Compression accuracy: ~${Math.round(efficiencies.reduce((t,v) => t+v, 0) / efficiencies.length*100)}%` : '';

    this.tasker.setState({
      complete: true,
      running: false,
      tasks: [],
      text: `Transcode complete${totalEfficiency}`
    });


    await this.tasker.stop();
    this.tasker.destroy();
    pv.destroy();

    if (pv.failed > 0)
      console.log(`  ${chalk.red(figures.cross)} ${pv.failed} file${pv.failed > 1 ? 's' : ''} failed. ${chalk.keyword('orange')('errors.txt')}`);

    const bell = !this.program.quiet ? '\x07' : '';
    console.log(`  ${chalk.green(figures.tick + ' Your brand new video files are in the ')}${chalk.keyword('orange')('exports')}${chalk.green(' folder!')}${bell}`);

    // Remove 2-pass data files
    fs.remove('ffmpeg2pass-0.log').catch(() => {});
    fs.remove('ffmpeg2pass-0.log.mbtree').catch(() => {});
    fs.remove('ffmpeg2pass-0.log.temp').catch(() => {});

    return true;

  }



}

module.exports = Transcode;