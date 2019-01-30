# Little Espresso


<p align="center">
    <a alt="Link to NPM" href="https://www.npmjs.com/package/little-espresso"><img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat-square&logo=npm"></a>
    <img src="https://img.shields.io/badge/Little_Espresso-__☕-FFDC00.svg?style=flat-square">
    <img src="https://img.shields.io/github/license/marcuscemes/little-espresso.svg?style=flat-square">
    <img src="https://img.shields.io/bundlephobia/min/little-espresso.svg?style=flat-square&colorB=0074D9">
    <img src="https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=flat-square">
</p>

<p align="center">
  <img src="https://gist.githubusercontent.com/MarcusCemes/a068081ccdf02e161d4a94c7d6b1a3db/raw/1d1f67d9dffd66b810f9d41f5df36089450e7e65/Little%2520Espresso%2520-%2520Demo%2520%252301.svg?sanitize=true" alt="An example with the command line" width="600">
</p>

## Features

- 🎬 **High quality** video compression - uses the best settings possible encoder settings
- 📈 **Two-pass encoding** - for the best possible data distribution
- 📦 Zero configuration - works right **out of the box**
- ✂️ **Cross platform** - it could probably even work on your phone
- 🔥 Uses a **powerful** industry-standard video encoder
- 😊 **Friendly experience** - telling you what's going on, from start to finish

## Why?
Sharing pictures is a blast. What if you want to share video? Ever hit that file size limit when sending an email? How about you want to share a video extract with someone over Skype? Today, we're surrounded by movie content, yet the hidden difficulty of streaming such vast quantities of data often go unnoticed. Platforms like YouTube make it look easy, that's if you don't mind advertisements, tracking and inappropriate "recommended videos". In 2016, **73% of all internet traffic was video content**, and it's only going to rise. It's hands-down the biggest space eater on the internet.

The go-to solution for sharing video is... Upload it to Google Drive, Dropbox, or any other file host! While this is a fantastic solution for high quality content, it's often unnecessary. I've downloaded gigabytes from Google Drive in Adobe ProRes format for a two minute video, because they guy didn't know a thing about video formats.

Little Espresso makes it easy, with its *main focus being on compressing within a certain size limit*, such as those imposed by email platforms, while retaining the best quality possible! All videos are encoded at the slowest (but best!) preset with two-pass encoding by default.

## Getting started

<details><summary><b>The simple version (for advanced users)</b></summary><p>

### Advanced installation

> I know what I'm doing, just hurry up!

Install [Node.js](https://nodejs.org) and [FFmpeg](https://www.ffmpeg.org/), and then run

    npm i -g little-espresso

The following example uses [NVM](https://github.com/creationix/nvm), which is the **recommended** way of installing Node.js

```bash
# Install FFmpeg
$ sudo apt update
$ sudo apt install ffmpeg

# Install NVM
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash

# RESTART TERMINAL

# Install the latest version of node
$ nvm install node
$ nvm use node

# Install little-espresso
$ npm i -g little-espresso

# Now you can use it!
$ cd /home/videos/
$ little-espresso [options] <paths ...>
```

<p align="center"><sub>This is an example installation for Ubuntu. This depends of course on what platform you're using.</sub></p><br />

The equivalent of running `little-espresso` when installed locally is `node node_modules/little-espresso/bin/parse-cli.js`. The Node.js module itself exposes a function that can be used to start Little Espresso. The API for this documented in a Typescript Definitions file (index.d.ts);

```ts
// Import the function, options interface and the error response interface
const littleEspresso, { ProgramParameters, SpiltEspresso } = require('little-espresso');
const result = littleEspresso({
  resolution: 720,
  framerate: false
});
```

<p align="center"><sub><i>framerate: false</i> is the same as doing <i>--no-framerate</i>. It will not be touched.</sub></p>

---

</p></details>

### 😎 The Easy way

The easiest way is to download the executable program from the [releases](https://github.com/MarcusCemes/little-espresso/releases/latest) page. This is a single executable file that can be placed in any directory. You may either double-click on it to convert everything in the folder at once, or drag-and-drop a file onto the executable.
**You will still need to install [FFmpeg](https://www.ffmpeg.org/).** The good news is you can just place the downloaded *ffmpeg.exe* (or just *ffmpeg* for
macOS) and *ffprobe.exe* into the same folder where you put Little Espresso. For a more complete installation, see [The Hard way](#the-hard-way).

### 😬 The Hard way

The hard part is installing Node.js and FFmpeg. Little Espresso is can be installed with a single line.

### Prerequisites

Little Espresso has two dependencies. [Node.js](https://nodejs.org) and [FFmpeg](https://www.ffmpeg.org/). Node.js is a fantastic runtime environment that's being used by [NASA](https://foundation.nodejs.org/wp-content/uploads/sites/50/2017/09/Node_CaseStudy_Nasa_FNL.pdf) and [many, many others](https://thinkmobiles.com/blog/node-js-app-examples/).
It's built with the language that powers the web, and it's also the only way to get `npm`, the dominant package manager for web-related things, and the best way to install Little Espresso. FFMpeg is the most famous free video utility out there. It's great!

#### <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg" alt="drawing" height="12"/>  Windows
Node.js comes with an installer. FFmpeg is more complicated. You will need to download [the binaries](https://ffmpeg.zeranoe.com/builds/) (latest version, 64-bit, static). For a quick and dirty solution, place the *ffmpeg.exe* and *ffprobe.exe* executables in the same folder as the videos you will be converting, however it is **recommended** to place them somewhere permanent, and then add the location to [PATH](https://windowsloop.com/install-ffmpeg-windows-10/).

#### <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="drawing" height="12"/>  macOS
Node.js comes with an installer. For FFmpeg, it's **recommended** to install it using [HomeBrew](https://brew.sh/). To install Homebrew, visit [https://brew.sh](https://brew.sh/), it's very easy. Once that's done, run:

```bash
$ brew install node
$ brew install ffmpeg
```

<p align="center"><sub>Node.js can also be installed with Homebrew, it avoids having to use <i>sudo</i></sub></p>

#### <img src="https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg" alt="drawing" height="14"/>  Linux

You guys know what you're doing. You're playing with big boy stuff.

-----

### Installation

Open up a terminal. On Windows, it's called `cmd.exe`, and on macOS it's `Terminal.app`. Run the following line of code:

```bash
$ npm i -g little-espresso
```

That's it! This **i**nstalls Little Espresso **g**lobally. The `npm` command comes bundled with Node.js!

### Uninstalling

You may completely uninstall at any time with:

```bash
npm rm -g little-espresso
```

FFmpeg and Node.js are more difficult to uninstall. Ask Google.

## Usage

For [the easy way](#the-easy-way) users, double-click on the executable, or drag-and-drop a video file onto it.
For [the hard way](#the-hard-way) users, you may either use [one of the provided scripts](#a-simpler-option-for-hard-way-users) or you can take advantage of Little Espresso's full potential using command line. Open a new terminal window, and type the following:

```bash
$ cd /path/to/your/videos
$ little-espresso
```
<p align="center"><sub>The syntax is equivilent on Windows, macOS and Linux, however the path system may vary</sub></p><br />

Little Espresso will guide you through the rest with an interactive experience, which can be overridden with [command line parameters](#command-line-options).

### A simpler option for hard-way-users

You can find a quick launch script in the [releases](https://github.com/MarcusCemes/little-espresso/releases/latest) section. Download the script for your OS and place it somewhere where there are videos to convert. Double click on the script, and boom! No need to open terminal! It does it all for you!

## Command line options

Little Espresso is customizable. You can see a full list of the available flags by running `little-espresso --help`. Unless explicitly specified, all job-related parameters will be prompted to the user. Full automation may be achieved by using the -r, -f, -s, -e, -t and -F flags.

Usage: `little-espresso [options] <paths ...>`


|      Option      |                     What it does                    |
|:----------------:|:---------------------------------------------------:|
|                  |                                                     |
| -r, --resolution | Specify the resolution for all files                |
| -f, --framerate  | Specify the framerate for all files                 |
| -s, --start      | Specify the start time for all files                |
| -e, --end        | Specify the end time for all files                  |
| --no-resolution  | Disable resolution operations                       |
| --no-framerate   | Disable framerate operations                        |
| --no-start       | Disable start-trimming operations                   |
| --no-end         | Disable end-trimming operations                     |
| --ffmpeg         | Full path to FFmpeg binary                          |
| --ffprobe        | Full path to FFprobe binary                         |
| -p, --preset     | Change the H264 encoding preset (default: veryslow) |
| -t, --target     | The target file size (default: 8MB)                 |
| -h, --help       | Show this help menu                                 |
| -V, --version    | Show the program version                            |
| -F, --force      | Overwrite without asking                            |
| --quiet          | Disable the bell at the end                         |

#### Example

```bash
$ little-espresso -r 720 -f 30 -s 00:00:05 -e 00:00:10 -t 100MB -F --preset medium "../Videos/Clips" "../OtherStuff/video.mp4"
```

The `../Videos/Clips/` folder will be recursively scanned for videos, and `../OtherStuff/video.mp4` will also be added to the list. Every found video will be downscaled to a vertical resolution of *720*, a framerate of *30*, trimmed down to a duration of *5* seconds (00:00:05 → 00:00:10), and encoded with a bitrate to fall just under the *100MB* target using the *medium* preset.

If no paths are specified, the Current Working Directory (`.`) is used.

```
$ little-espresso
$ little-espresso .
$ little-espresso ./
```
<p align="center"><sub>These three lines are equivalent, they all launch Little Espresso in the current directory</sub></p>

### Some things to note

 * If the given resolution is higher than the source content, the source resolution will be used.
 * if the given framerate is higher than the source content, the source framerate will be used.
 * For time trimming, `auto` may be used to keep the original start/end time.
 * A trim interval beyond the video's timecode may produce an empty file, or just a single frame. No errors are thrown.
 * Compression accuracy will depend on a lot of factors, incluiding the encoding preset and time constraints.

## Built With

* [NodeJS](https://nodejs.org) - Powered by Chrome's V8 Javascript engine
* [FFmpeg](https://www.ffmpeg.org/) - Does anything you want, as long as it's related to video processing
* [Chalk](https://github.com/chalk/chalk) - A beautiful colour library
* [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - A fantastically intuitive user prompt library


## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/MarcusCemes/little-espresso/tags).

## Authors

* **Marcus Cemes** - *Project Owner* - [Website](https://mastermovies.co.uk/) - [GitHub](https://github.com/MarcusCemes)

## License

This project is licensed under the **Apache 2.0** License - see the [LICENSE.md](LICENSE.md) file for details
