'use strict';
const commandExists = require('command-exists');
const tasker = require('./tasker');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');

// Others can easily be added, as long as they are supported by FFmpeg
const SUPPORTED_EXTENSIONS = ['mp4', 'm4v', 'mpg', 'mpeg', 'mpv', 'm4v', 'mkv', 'flv', 'wmv', 'avi', 'mts', 'm2ts', 'mov', 'qt'];

class Prepare {

  constructor(program) {
    this.program = program;
  }

  async run(args) {
    const ffmpegTask = {
      text: 'Verifying FFmpeg installation',
      running: true
    };
    const filesTask = {
      text: 'Found 0 files',
      running: true
    };

    this.state = {
      text: "Getting some things ready",
      running: true,
      tasks: [
        ffmpegTask,
        filesTask
      ]
    };

    this.tasker = new tasker(this.state);
    this.tasker.start();

    let promises;

    try {
      promises = await Promise.all([
        this.has_ffmpeg(ffmpegTask),
        this.get_files(filesTask, args)
      ]);
    } catch (err) {
      this.state.running = false;
      this.state.complete = false;
      this.tasker.setState(this.state);
      await this.tasker.stop();
      console.log(chalk.red('\nThe program encountered a problem.'));
      const errorMessage = err.message.match(/^(?:Error: )?(.*)$/)[1];
      console.log(chalk.red(errorMessage));
      throw new Error(errorMessage);
    }

    this.state = {
      text: 'Found ' + promises[1].length + ' files',
      complete: true
    };
    this.tasker.setState(this.state);
    await this.tasker.stop();
    this.tasker.destroy();
    return promises[1];
  }




  async has_ffmpeg(task) {
    let result;
    try {
      result = await Promise.all([
        this.program.ffmpeg ? fs.exists(this.program.ffmpeg) : commandExists('ffmpeg'),
        this.program.ffprobe ? fs.exists(this.program.ffprobe) : commandExists('ffprobe'),
      ]);
    } catch (err) {
      task.running = false;
      task.complete = false;
      this.tasker.setState(this.state);
      task.text = "FFmpeg is not installed";
      throw new Error('Could not detect a FFmpeg installation')
    }
    result.forEach(v => { if (!v) {
      task.complete = false;
      task.running = false;
      task.text = "Unable to locate the FFmpeg binaries";
      throw new Error('The path provided for the FFmpeg binaries does not exist');
    }});
    task.complete = true;
    task.running = false;
    task.text = "FFmpeg is installed";
    this.tasker.setState(this.state);
    return true;
  }




  async get_files(task, args) {
    try {
      if (args.length === 0)
        args.push(process.cwd());

      let files = [];

      for (const file of args) {
        if (fs.existsSync(file)) {
          const p = path.resolve(file);
          const stats = fs.statSync(p);
          if (stats.isDirectory()) {
            const new_files = await fg([path.join(p, '**/*.{' + SUPPORTED_EXTENSIONS.join(',') + '}'), '!' + path.join(p, 'exports/**/*.{' + SUPPORTED_EXTENSIONS.join(',') + '}')]);
            for (const new_file of new_files)
              if (!files.includes(new_file))
                files.push(new_file);
          } else if (stats.isFile()) {
            if (!files.includes(p))
              files.push(p);
          }
        }
        task.text = "Found " + files.length + " files";
        this.tasker.setState(this.state);
      }


      task.complete = true;
      this.tasker.setState(this.state);

      return files;
    } catch (err) {
      task.running = false;
      task.complete = false;
      this.tasker.setState(this.state);
      task.text = "Could not scan for files"
      throw new Error(err)
    }
  }

}

module.exports = Prepare;
