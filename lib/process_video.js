'use strict';
const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const figures = require('figures');
const chalk = require('chalk');
const readline = require('readline');
const randomMessage = require('./random_message');

const MINIMUM_AUDIO_BITRATE = 64000;
const CORRECTION_MODIFIER = 0.95;   // The "real" target, compensate for accuracy
const FULLHD_PIXELS = 2073600;      // Number of pixels in a 1920x1080 frame
const FULLHD_BITRATE = 8000000;     // 8mbps
const STANDARD_ASPECT_RATIO = 16 / 9;
const MAXIMUM_AUDIO_BITRATE = 128000; // Don't need to go above 128k for standard content
const MAX_ATTEMPS = 3;

const DEFAULT_PRESET = 'veryslow';
const presets = [
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',
  'veryslow',
  'placebo'
];


/**
 * An advanced self-contained class to process a transcode job
 * Designed for Little Espresso
 * Call .destroy() when you're done with the class to release handles
 *
 * @class ProcessVideo
 */
class ProcessVideo {

  constructor(tasker, options, exportsFolder, numberJobs, program) {
    this.tasker = tasker;
    this.options = options;
    this.exportsFolder = exportsFolder;
    this.numberJobs = numberJobs;
    this.program = program;
    this.messageInterval = setInterval( () => this.message = randomMessage(), 10000);
    this.message = randomMessage();

    this.state = {};
    this.correction = '';  // Correctional message
    this.failed = 0;
  }

  update(state) {
    Object.assign(this.state, state);
    this.tasker.setState(this.state);
  }

  async process(transcodeJob, currentJobNumber) {

    // Surround the whole ASYNC process in a try/catch
    try {

      const parsedPath = path.parse(transcodeJob.path);

      this.statusData = { stage: 0, path: parsedPath.base, job: currentJobNumber };
      this._generateStatus(); // Print to STDOUT


      // Time for calculations!

      // VIDEO STATS
      const videoStream = this._getHighestQualityVideoStream(transcodeJob.metadata);
      const videoResolution = videoStream.height;
      const framerateParts = videoStream.r_frame_rate.split('/');
      const videoFramerate = parseInt(framerateParts[0]) / parseInt(framerateParts[1]);
      const videoStartTime = parseFloat(videoStream.start_time);
      const videoEndTime = videoStartTime + parseFloat(videoStream.duration);

      // CHANGE REQUIRED
      const resolutionChange = transcodeJob.resolution && transcodeJob.resolution < videoResolution;
      const framerateChange = transcodeJob.framerate && transcodeJob.framerate < videoFramerate;
      const startChange = transcodeJob.trimStart && transcodeJob.trimStart !== 'auto';
      const endChange = transcodeJob.trimEnd && transcodeJob.trimEnd !== 'auto';

      // REAL OUTPUT PARAMETERS
      const realResolution = resolutionChange ? transcodeJob.resolution : videoResolution;
      const realFramerate = framerateChange ? transcodeJob.framerate : Math.round(parseFloat(videoFramerate));
      const realStart = startChange ? parseFloat(transcodeJob.trimStart) : 0;
      const realEnd = endChange ? parseFloat(transcodeJob.trimEnd) : videoEndTime;
      const duration = realEnd - realStart;

      // FFMPEG ARGUMENTS
      const resolutionArgument = resolutionChange ? `-vf scale=-2:${realResolution}` : '';
      const framerateArgument = framerateChange ? `-r ${realFramerate}` : '';
      const startArgument = startChange ? `-ss ${realStart}` : '';
      const endArgument = endChange ? `-to ${duration}` : ''; // A-ha! It's the duration! Not end time!

      // BITRATE
      const totalBitrate = (parseInt(this.options.compression_value) * 8 / duration) * CORRECTION_MODIFIER;
      const maxAllowedVideoBitrate = totalBitrate - MINIMUM_AUDIO_BITRATE;
      const recommendedBitrate = this.giveMeAGoodBitrate(parseInt(realResolution));
      let videoBitrate = Math.min(maxAllowedVideoBitrate, recommendedBitrate);
      let audioBitrate = Math.min(totalBitrate - videoBitrate, MAXIMUM_AUDIO_BITRATE);


      // Allow 2 retries if the target is missed
      let attempt = 0;
      while (true) {

        if (attempt >= MAX_ATTEMPS) {
          this.failures++;
          break;
        }
        attempt++;

        const videoBitrateArgument = '-b:v ' + videoBitrate;
        const audioBitrateArgument = '-b:a ' + audioBitrate;

        const videoHealthFactor = videoBitrate / recommendedBitrate;
        const videoHealth = videoHealthFactor < 0.5 ? chalk.red(figures.warning) : (videoHealthFactor < 1 ? chalk.keyword('orange')(figures.warning) : chalk.green(figures.tick));
        const audioHealth = audioBitrate < 96000 ? chalk.red(figures.warning) : (audioBitrate < 120000 ? chalk.keyword('orange')(figures.warning) : chalk.green(figures.tick));

        Object.assign(this.statusData, {
          stage: 1,
          resolution: realResolution,
          framerate: realFramerate,
          videoHealth: videoHealth,
          audioHealth: audioHealth,
          videoBitrate: videoBitrate,
          audioBitrate: audioBitrate,
          duration: duration
        });
        this._generateStatus();

        const preset = this.program.preset && presets.includes(this.program.preset) ? this.program.preset : DEFAULT_PRESET;
        const ffmpegBinary = this.program.ffmpeg ? this.program.ffmpeg : 'ffmpeg';

        const nullLocation = process.platform === "win32" ? 'NUL' : '/dev/null';
        let pass1Arguments = `${ffmpegBinary} -y -v fatal -stats -nostdin ${startArgument} -i "${transcodeJob.path}" ${endArgument} `;
        pass1Arguments += `-c:v libx264 -profile high -preset ${preset} ${videoBitrateArgument} -pass 1 -filter_complex amerge -ac 2 -c:a aac ${audioBitrateArgument} `;
        pass1Arguments += `${framerateArgument} ${resolutionArgument} -f mp4 ${nullLocation}`;

        const exportPath = path.join(this.exportsFolder, parsedPath.name);
        let pass2Arguments = `${ffmpegBinary} -y -v fatal -stats -nostdin ${startArgument} -i "${transcodeJob.path}" ${endArgument} `;
        pass2Arguments += `-c:v libx264 -profile high -preset ${preset} ${videoBitrateArgument} -pass 2 -filter_complex amerge -ac 2 -c:a aac ${audioBitrateArgument} `;
        pass2Arguments += `${framerateArgument} ${resolutionArgument} -f mp4 "${exportPath}.mp4"`;


        // Render the first pass
        const pass1 = execa(pass1Arguments);
        this._readProgress(pass1.stderr, realFramerate * duration); // Pipe into progress reader
        await pass1;


        this.statusData.stage = 2;
        this._generateStatus();

        // Render the second pass
        const pass2 = execa(pass2Arguments);
        this._readProgress(pass2.stderr, realFramerate * duration); // Pipe into progress reader
        await pass2;

        // Wait until the output file pops up!
        while (!fs.existsSync(`${exportPath}.mp4`)) {
          await new Promise(res => setTimeout(res, 100));
        }

        // Verify that the output target was met
        const stats = fs.lstatSync(`${exportPath}.mp4`);
        if (stats.size > this.options.compression_value) {
          videoBitrate *= CORRECTION_MODIFIER;
          audioBitrate *= CORRECTION_MODIFIER;
          this.correction = `${chalk.keyword('orange')(`\n    Attempt ${attempt + 1}, file too large! Applying correctional modifier...`)}`
          continue;
        } else {
          this.correction = '';
          return {efficiency: stats.size / parseFloat(this.options.compression_value)}
        }

      }

      // Reset the correctional message and fail
      this.correction = '';
      return false;

    } catch (err) {

      // Dirty error logging in an async fashion
      fs.ensureFile('errors.txt').then(() => {
        fs.appendFile('errors.txt', err + '\n');
      }).catch(() => { });

      this.failed++;
      return false;

    }

  }


  /**
   * Fetches the best video stream from FFprobe's metadata
   */
  _getHighestQualityVideoStream(metadata) {
    let bestStream = null;
    for (const stream of metadata.streams) {
      if (stream.codec_type === "video") {
        if (bestStream === null || stream.height > bestStream.height) {
          bestStream = stream;
        }
      }
    }
    return bestStream;
  }


  /**
   * Formula to estimate bitrate based on amount of pixels
   */
  giveMeAGoodBitrate(verticalResolution) {

    // Assuming a standard aspect ratio...
    const horizontalResolution = verticalResolution * STANDARD_ASPECT_RATIO;
    const pixels = horizontalResolution * verticalResolution;

    return (pixels) / FULLHD_PIXELS * FULLHD_BITRATE;
  }


  /**
   * Generate the console status message
   * @param {*} currentJobCompletion Percentage of pass completion
   */
  _generateStatus(currentJobCompletion = 0) {

    const data = this.statusData;
    const completion = data.job + ((currentJobCompletion/2) + (data.stage === 2 ? 0.5 : 0));

    let state = {
      running: true
    };

    let text = "Transcoding   " + this._bar(completion, this.numberJobs) + (this.failed > 0 ? `   ${chalk.bold.red('[' + this.failed + ' failed]')}` : '');
    text += `\n ${chalk.keyword('orange')(figures.pointer)} ${chalk.cyan(data.path)}`;

    if (data.stage === 1) {
      text += `\n     Video: ${data.videoHealth} ${chalk.cyan(Math.round(data.videoBitrate / 100000) / 10)} Mbit/s H264, ${chalk.cyan(data.resolution)}/${chalk.cyan(data.framerate)}p, ${chalk.cyan(Math.round(data.duration))} seconds`;
      text += `\n     Audio: ${data.audioHealth} ${chalk.cyan(Math.round(data.audioBitrate / 1000))} Kbit/s AAC`;
      text += `\n       ${chalk.keyword('orange')(figures.pointer)} First pass ${chalk.grey(figures.pointer + ' Second pass')}${this.correction}`;
      text += `\n\n     ${this.message}`;
    } else if (data.stage === 2) {
      text += `\n     Video: ${data.videoHealth} ${chalk.cyan(Math.round(data.videoBitrate / 100000) / 10)} Mbit/s H264, ${chalk.cyan(data.resolution)}/${chalk.cyan(data.framerate)}p, ${chalk.cyan(Math.round(data.duration))} seconds`;
      text += `\n     Audio: ${data.audioHealth} ${chalk.cyan(Math.round(data.audioBitrate / 1000))} Kbit/s AAC`;
      text += `\n       ${chalk.grey(figures.pointer + ' First pass')} ${chalk.cyan(figures.pointer)} Second pass${this.correction}`;
      text += `\n\n     ${this.message}`;
    } else {
      state.tasks = [{
        text: 'Calculating...\n\n\n\n     ' + this.message,
        running: true
      }];
    }

    state.text = text;
    this.tasker.setState(state);

  }


  /**
   * Generate a simple progress bar
   */
  _bar(value, total) {

    const percent = Math.min(value / total, 1);
    const width = 25;
    const n_filled = Math.floor(width * percent);
    const n_blank = width - n_filled;
    const filled = chalk.cyan(figures.hamburger.repeat(n_filled));
    const blank = ' '.repeat(n_blank);

    return `|${filled}${blank}| ${Math.round(percent * 100)}%`;

  }

  /**
   * Parse FFmpeg's -stats option to get the encode percentage
   * @param {*} stream FFmpeg's stderr stream
   * @param {*} totalFrames The total number of frames to render
   */
  _readProgress(stream, totalFrames) {
    const rl = readline.createInterface({
      input: stream,
    });
    rl.on('line', (input) => {
      const regex = /frame=\s*([0-9]+)/g;
      const result = regex.exec(input);
      if (result && result[1]) {
        this._generateStatus(parseInt(result[1]) / totalFrames);
      }
    });
    rl.once('close', () => {
      rl.close();
    });
  }


  /**
   * Unbinds the setInterval
   */
  destroy() {
    clearInterval(this.messageInterval);
  }

}

module.exports = ProcessVideo;