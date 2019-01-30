'use strict';
const Banner = require('./lib/banner');
const Prepare = require('./lib/prepare');
const Transcode = require('./lib/transcode');
const chalk = require('chalk');

const packageJson = require("./package.json");
const PROJECT_TITLE = packageJson.prettyName;
const VERSION = packageJson.version;

async function start(program) {

  const banner = new Banner();
  banner.show(PROJECT_TITLE, VERSION)

  const prepare = new Prepare(program);
  let raw_files;
  try {
    raw_files = await prepare.run(program.files);
  } catch (err) {
    console.log(chalk.red('Preparation encountered an error'));
    return {
      message: err
    };
  }


  if (raw_files.length === 0) {
    console.log(chalk.red(`There are no files to process.`));
    return {
      message: 'No files to process'
    };
  }


  const transcode = new Transcode(raw_files, program);
  try {
    await transcode.run();
  } catch (err) {
    console.log(chalk.red('Transcode encountered an error'));
    return {
      message: err
    };
  }

  return true;

}


module.exports = start;