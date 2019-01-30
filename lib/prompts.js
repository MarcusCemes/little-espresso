'use strict';
const inquirer = require('inquirer');
const filesizeParser = require('filesize-parser');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');
const figures = require('figures');
const path = require('path');

// Data Flow
// RAW VALUE => filter => validate
// RAW VALUE => transformer
// on_submit ==> filter => transformer.isFinal
const resolutionValidation = {
  default: () => 720,
  validate: value => {
    if (isNaN(value)) throw 'Enter a valid number';
    if (value <= 0) throw 'Must be larger than 0';
    if (value % 2 === 1) throw 'Must be even';
    return true;
  },
  transformer: (value, answers, options) => {
    if (options.isFinal === true) return chalk.cyan(value);
    if (isNaN(value) || value <= 0 || value % 2 === 1) return chalk.red(value);
    return chalk.green(value);
  }
};

const framerateValidation = {
  default: () => 30,
  validate: value => {
    if (isNaN(value)) throw 'Enter a valid number';
    if (value <= 1) throw 'Must be larger than 0';
    return true;
  },
  transformer: (value, answers, options) => {
    if (options.isFinal === true) return chalk.cyan(value);
    if (isNaN(value) || value <= 1) return chalk.red(value);
    return chalk.green(value);
  },
  filter: (value) => {
    return parseInt(value);
  }
};

const startValidation = {
  default: () => "auto",
  validate: value => {
    if (typeof value === 'number' && value >= 0) return true;
    if (value === 'auto') return true;
    throw 'Must be in HH:MM:SS.MILLISECONDS or SECONDS format, or "auto"'
  },
  transformer: (value, answers, options) => {
    if (options.isFinal) return chalk.cyan(value + (value === 'auto' ? '' : 's'));
    if (RegExp(/^([0-9]{2}:){0,2}[0-9]{2}(\.[0-9]+)?$/).test(value) || RegExp(/^[0-9]+(\.[0-9]+)?$/).test(value) && parseFloat(value) >= 0 || value === 'auto')
      return chalk.green(value);
    return chalk.red(value);
  },
  filter: value => {
    if (RegExp(/^([0-9]{2}:){0,2}[0-9]{2}(\.[0-9]+)?$/).test(value)) {
      const parts = value.split(':');
      return parts.reduce((t, v) => t * 60 + parseFloat(v));  // Timestamp to seconds
    }
    if (RegExp(/^[0-9]+(\.[0-9]+)?$/).test(value)) return parseFloat(value);
    if (value === 'auto') return value;
    return false;
  },
};

const endValidation = {
  default: () => "auto",
  validate: (value, answers) => {
    if (value === 'auto') return true;
    if (typeof value === 'number' && typeof answers.trim_start === 'number' && value <= answers.trim_start || typeof value === 'number' && value <= 0) throw 'Must be larger than the start time (' + answers.trim_start + ')';
    if (value === false) throw 'Must be in HH:MM:SS.MILLISECONDS or SECONDS format, or "auto"';
    return true;
  },
  transformer: (value, answers, options) => {
    if (options.isFinal) return chalk.cyan(value + (value === 'auto' ? '' : 's'));
    if (value === 'auto') return chalk.green(value);
    let time;
    if (RegExp(/^([0-9]{2}:){0,2}[0-9]{2}(\.[0-9]+)?$/).test(value)) {
      const parts = value.split(':');
      time = parts.reduce((t, v) => t * 60 + parseFloat(v), 0);  // Timestamp to seconds
    }
    if (RegExp(/^[0-9]+(\.[0-9]+)?$/).test(value)) {
      time = parseFloat(value);
    }
    if (typeof time === 'number') {
      if (typeof answers.trim_start === 'number' && time <= answers.trim_start) return chalk.red(value);
      return chalk.green(value);
    }
    return chalk.red(value);
  },
  filter: value => {
    if (value === 'auto') return value;
    if (RegExp(/^([0-9]{2}:){0,2}[0-9]{2}(\.[0-9]+)?$/).test(value)) {
      const parts = value.split(':');
      return parts.reduce((t, v) => t * 60 + parseFloat(v), 0);  // Timestamp to seconds
    }
    if (RegExp(/^[0-9]+(\.[0-9]+)?$/).test(value)) {
      return parseFloat(value);
    }
    return false;
  }
};

const allYesNoChoices = {
  choices: [
    {
      key: 'a',
      name: 'Modify for ALL videos',
      value: 0
    },
    {
      key: 'y',
      name: 'YES, individually',
      value: 1
    },
    {
      key: 'n',
      name: 'No',
      value: 2
    }
  ]
};


class Prompts {

  constructor(program) {
    this.program = program;
  }

  async ask() {

    const optionsFromArguments = {};

    // Check for file size target
    if (typeof this.program.target !== 'undefined' && this.program.target !== true) {
      try {
        const parsedSize = filesizeParser(this.program.target, { base: 10 });
        if (parsedSize >= 1000) {
          optionsFromArguments.compression_value = parsedSize;
          console.log(`  ${chalk.keyword('orange')(figures.pointer)} Using compression target ${chalk.cyan(prettyBytes(parsedSize))}`);
        }
      }
      catch (err) {
        console.log(`  ${chalk.red(figures.cross)} Bad compression target '${this.program.target}': ${err}`);
      }
    }

    // Check for resolution
    if (typeof this.program.resolution !== 'undefined' && this.program.resolution !== true) {
      if (this.program.resolution === false) {
        optionsFromArguments.resolution = 2;
      } else {
        try {
          if (resolutionValidation.validate(this.program.resolution)) {
            optionsFromArguments.resolution = 0;
            optionsFromArguments.resolution_value = this.program.resolution;
            console.log(`  ${chalk.keyword('orange')(figures.pointer)} Using resolution ${chalk.cyan(this.program.resolution)}`);
          }
        } catch (err) {
          console.log(`  ${chalk.red(figures.cross)} Bad resolution '${this.program.resolution}': ${err}`);
        }
      }
    }

    // Check for framerate
    if (typeof this.program.framerate !== 'undefined' && this.program.framerate !== true) {
      if (this.program.framerate === false) {
        optionsFromArguments.framerate = 2;
      } else {
        try {
          if (framerateValidation.validate(this.program.framerate)) {
            optionsFromArguments.framerate = 0;
            optionsFromArguments.framerate_value = this.program.framerate;
            console.log(`  ${chalk.keyword('orange')(figures.pointer)} Using framerate ${chalk.cyan(this.program.framerate)}`);
          }
        } catch (err) {
          console.log(`  ${chalk.red(figures.cross)} Bad framerate '${this.program.framerate}': ${err}`);
        }
      }
    }

    // Check for start
    if (typeof this.program.start !== 'undefined' && this.program.start !== true
        || typeof this.program.end !== 'undefined' && this.program.end !== true) {

      optionsFromArguments.trim = 0;
      optionsFromArguments.trim_start = 'auto';
      optionsFromArguments.trim_end = 'auto';

      if (this.program.start) {
        try {
          const parsedStart = startValidation.filter(this.program.start);
          if (startValidation.validate(parsedStart)) {
            optionsFromArguments.trim_start = parsedStart;
            console.log(`  ${chalk.keyword('orange')(figures.pointer)} Using start time ${chalk.cyan(parsedStart)}`);
          }
        } catch (err) {
          console.log(`  ${chalk.red(figures.cross)} Bad start time '${this.program.start}': ${err}`);
        }
      }

      if (this.program.end) {
        try {
          const parsedEnd = endValidation.filter(this.program.end);
          if (endValidation.validate(parsedEnd, { trim_start: optionsFromArguments.trim_start })) {
            optionsFromArguments.trim_end = this.program.end;
            console.log(`  ${chalk.keyword('orange')(figures.pointer)} Using end time ${chalk.cyan(parsedEnd)}`);
          }
        } catch (err) {
          console.log(`  ${chalk.red(figures.cross)} Bad end time '${this.program.end}': ${err}`);
        }
      }

    }

    const answers = await inquirer
      .prompt([
        {
          type: 'input',
          name: 'compression_value',
          message: `Enter desired ${chalk.green('compression target')} (base 10): `,
          default: () => "8 MB",
          prefix: `  ${chalk.keyword('orange')('?')}`,
          validate: value => !isNaN(value) ? (value < 1000 ? 'Must be larger than 1MB' : true) : 'Not a valid file size. Try "8MB"',
          transformer: (value, answers, options) => {
            if (options.isFinal === true) {
              return chalk.cyan(prettyBytes(value) + ` (${value} bytes)`);
            }
            try {
              filesizeParser(value, { base: 10 });
              return chalk.green(value);
            } catch (err) {
              return chalk.red(value);
            }
          },
          filter: value => {
            try {
              return filesizeParser(value, { base: 10 });
            } catch (err) {
              return false;
            }
          },
          when: () => optionsFromArguments.compression_value === undefined
        },
        {
          type: 'expand',
          message: `Modify ${chalk.green('resolution')}? `,
          prefix: `  ${chalk.keyword('orange')('?')}`,
          name: 'resolution',
          ...allYesNoChoices,
          when: () => optionsFromArguments.resolution === undefined
        },
        {
          type: 'input',
          name: 'resolution_value',
          message: `Enter desired ${chalk.green('vertical resolution')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...resolutionValidation,
          when: answers => answers.resolution === 0 ? true : false
        },
        {
          type: 'expand',
          message: `Modify ${chalk.green('framerate')}? `,
          prefix: `  ${chalk.keyword('orange')('?')}`,
          name: 'framerate',
          ...allYesNoChoices,
          when: () => optionsFromArguments.framerate === undefined
        },
        {
          type: 'input',
          name: 'framerate_value',
          message: `Enter desired ${chalk.green('framerate')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...framerateValidation,
          when: answers => answers.framerate === 0 ? true : false
        },
        {
          type: 'expand',
          message: `Modify ${chalk.green('start/end')}? `,
          prefix: `  ${chalk.keyword('orange')('?')}`,
          name: 'trim',
          ...allYesNoChoices,
          when: () => optionsFromArguments.trim === undefined
        },
        {
          type: 'input',
          name: 'trim_start',
          message: `Enter desired ${chalk.green('start time')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...startValidation,
          when: answers => answers.trim === 0 && optionsFromArguments.trim === undefined ? true : false
        },
        {
          type: 'input',
          name: 'trim_end',
          message: `Enter desired ${chalk.green('end time')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...endValidation,
          when: answers => answers.trim === 0 && optionsFromArguments.trim === undefined ? true : false
        }
      ]);

    return Object.assign(optionsFromArguments, answers);

  }


  async fill(transcodeJobs, options) {

    // Globally set, or needs to be asked separately
    let resolutionDone = false;
    let framerateDone = false;
    let trimDone = false;


    // Resolution ALL
    if (options.resolution === 0 || options.resolution === 2) {
      for (const job of transcodeJobs)
        job.resolution = options.resolution === 0 ? options.resolution_value : false;
      resolutionDone = true;
    }

    // Framerate ALL
    if (options.framerate === 0 || options.framerate === 2) {
      for (const job of transcodeJobs)
        job.framerate = options.framerate === 0 ? options.framerate_value : false;
      framerateDone = true;
    }

    // Trim ALL
    if (options.trim === 0 || options.trim === 2) {
      for (const job of transcodeJobs) {
        job.trimStart = options.trim === 0 ? options.trim_start : false;
        job.trimEnd = options.trim === 0 ? options.trim_end : false;
      }
      trimDone = true;
    }

    if (resolutionDone && framerateDone && trimDone) return transcodeJobs;

    // Ask values for each video
    console.log();
    for (const job of transcodeJobs) {
      // Print file name
      console.log(`\n  ${chalk.cyan(path.parse(job.path).base)}:`);

      if (!resolutionDone) {
        const result = await inquirer.prompt({
          type: 'input',
          name: 'resolution_value',
          message: `Enter ${chalk.green('vertical resolution')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...resolutionValidation
        });
        job.resolution = result.resolution_value;
      }
      if (!framerateDone) {
        const result = await inquirer.prompt({
          type: 'input',
          name: 'framerate_value',
          message: `Enter ${chalk.green('framerate')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...framerateValidation
        });
        job.framerate = result.framerate_value;
      }
      if (!trimDone) {
        const result = await inquirer.prompt([{
          type: 'input',
          name: 'trim_start',
          message: `Enter ${chalk.green('start time')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...startValidation
        },
        {
          type: 'input',
          name: 'trim_end',
          message: `Enter ${chalk.green('end time')}: `,
          prefix: `    ${chalk.keyword('orange')(figures.pointer)}`,
          ...endValidation
        }]);
        job.trimStart = result.trim_start;
        job.trimEnd = result.trim_end;
      }
    }

    return transcodeJobs;


  }


  async getOverwritePermission() {
    return inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite_permission',
      message: chalk.red('The exports directory is not empty! Overwrite? DANGEROUS!!!'),
      prefix: `  ${chalk.red(figures.warning)}`,
      default: () => false
    }]);
  }

}

module.exports = Prompts;