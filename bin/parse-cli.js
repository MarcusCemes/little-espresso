#!/usr/bin/env node
'use strict';

const program = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// Set the window title
process.stdout.write(
  String.fromCharCode(27) + "]0;" + packageJson.prettyName + String.fromCharCode(7)
);

// Set up argument parsing
program.on('--help', function () {
  console.log(`
  A lightweight video compression tool.
  Compresses all given files to git under a certain size threshhold.
  If a directory is passed, it will be scanned for files.
  If no paths are given, the program will default to the current working directory
  Some options can be negated with the ${chalk.red('--no-')} prefix.

  This program calculates file sizes in base-10, where 1000MB = 1GB.
  If you're on Windows, you can increase the compression target to compensate
  for the system's base-2 convention (1024MB = 1GB).

  Examples:
  $ litle-espresso ${chalk.green('--target 40000 --resolution 720 --framerate 30 --start 30 --end 00:01:00')} ${chalk.keyword('orange')('videos/')}
  $ little-espresso ${chalk.green('-t 16.5MB --no-resolution --framerate 45 -f -s 5 -e 25')} ${chalk.keyword('orange')('important_clips/ some_other_video.mp4')}`)
});

program
  .name(packageJson.name)
  .version(packageJson.version)
  .usage(chalk.cyan('[options] <paths ...>'))
  .option('-c, --colour', 'force Truecolor')
  .option('-F, --force', 'overwrite without asking')
  .option('--quiet', 'don\'t play a notification sound')
  .option('-p, --preset <name>', 'x264 preset. This is set to veryslow by default')
  .option('-t, --target <size>', 'The output size target')
  .option('-r, --resolution <vertical>', 'specify the output resolution for all files')
  .option('-f, --framerate <number>', 'specify the output framerate for all files')
  .option('-s, --start <time>', 'specify the start time for all files')
  .option('-e, --end <time>', 'specify the end time for all files')
  .option('--no-resolution')
  .option('--no-framerate')
  .option('--no-start')
  .option('--no-end')
  .option('--ffmpeg <path>', 'Full path to FFmpeg\'s binaries (with the filename!)')
  .option('--ffprobe <path>', 'Full path to FFprobe\'s binaries (with the filename!)')
  .parse(process.argv);


if (program.colour) {
  chalk.level = 3;
}

process.stdout.write('Brewing...');
const start = require('../index.js');
process.stdout.write('\r[K');


program.files = program.args;

start(program);
