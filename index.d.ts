// Type definitions for [~Little Espresso~] [~1.0.1~]
// Project: [~Little Espresso~]
// Definitions by: [~Marcus Cemes~] <[~https://mastermovies.co.uk]>

export = littleEspresso;

/**
 * Starts the process of searching
 * for files, and guiding the user through the experience.
 * The program may be configured to require no standard input whatsoever through
 * the user of the ProgramParameters.
 *
 * @param {ProgramParameters} programParameters The global program parameters.
 * Similar to arguments on a command line
 *
 * @returns {littleEspresso.SpiltEspresso | true} An object with the error message, or true
 */
declare function littleEspresso(programParameters: littleEspresso.ProgramParameters): littleEspresso.SpiltEspresso | true;


declare namespace littleEspresso {


  export interface ProgramParameters {

    /**
     * An array of paths that will be searched for video files.
     * May be video files directly or folders to scan.
     * If none are provided, the CWD is used.
     */
    files?: string[];

    /**
     * Force TrueColour output
     */
    colour?: boolean;

    /**
     * Overwrite files without warning
     */
    force?: boolean;

    /**
     * Toggle the bell sound at the end of of execution
     */
    quiet?: boolean;

    /**
     * The h264 encoding preset to use
     */
    preset?: string;

    /**
     * The target export size in bytes
     */
    target?: number;

    /**
     * The export resolution for all files (without upscaling)
     */
    resolution?: number | boolean;

    /**
     * THe export framerate for all files (without oversampling)
     */
    framerate?: number | boolean;

    /**
     * The start time for video trimming, for all files
     */
    start?: number | boolean;

    /**
     * The end time for video trimming, for all files
     */
    end?: number | boolean;

    /**
     * The path to the FFmpeg binary, including the filename
     */
    ffmpeg?: string;

    /**
     * The path to the FFprobe binary, including the filename
     */
    ffprobe?: string;
  }

  /**
   * A standard Little Espresso error
   */
  export interface SpiltEspresso {
    message: string;
  }

}