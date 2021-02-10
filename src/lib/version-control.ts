import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import semver from 'semver';
import Spinner from './spinner';
import chalk from 'chalk';
import { spawn } from './child-process';
import { SgData } from './models';

/**
* Looks for singular.json file in the current working directory.
* If not found, will traverse backwards one directory level at a time until reaching root directory or finding the file.
* If file is found, the content is loaded into app data's `singular` node, otherwise it would be `null`.
*/
export async function loadSingularJson() {

  let currentDir = process.cwd();
  let found = false;

  while ( ! found ) {

    // Look for singular.json
    if ( await fs.pathExists(path.resolve(currentDir, 'singular.json')) ) {

      app.data<SgData>().singular = await fs.readJson(path.resolve(currentDir, 'singular.json'));
      app.data<SgData>().projectRoot = currentDir;
      found = true;

    }
    // If reached root directory
    else if ( path.parse(process.cwd()).root === currentDir ) {

      app.data<SgData>().singular = null;
      app.data<SgData>().projectRoot = null;
      found = true;

    }
    // Traverse back one directory
    else {

      currentDir = path.resolve(currentDir, '..');

    }

  }

}

/**
* Guards against incompatible projects.
* If needed, a local CLI will be installed and the commands will be delegated to it.
*/
export async function versionControl() {

  const data = app.data<SgData>();

  // If not inside a Singular project, ignore
  if ( ! data.singular ) return;

  const localPath = path.resolve(data.projectRoot, 'node_modules', '@singular', 'cli', 'bin', 'sg.js');

  // If versions are incompatible
  if ( semver.major(data.version) !== semver.major(data.singular.cli) ) {

    // Setup the local CLI if not set before
    if ( ! data.singular.useLocal || ! await fs.pathExists(localPath) ) {

      // Warn
      new Spinner().warn(chalk.yellow('This project was generated using an incompatible CLI version! A local version will be installed and used instead.'));

      // Update singular.json and app data
      delete data.singular.useLocal;
      await fs.writeJson(path.resolve(data.projectRoot, 'singular.json'), data.singular, { spaces: 2 });

      // Install the exact CLI version locally
      const child = spawn(
        'npm',
        ['install', `@singular/cli@${data.singular.cli}`, '--save-dev'],
        {
          windowsHide: true,
          cwd: data.projectRoot,
          stdio: ['ignore', 'ignore', 'pipe']
        }
      );

      const stderrCache: string[] = [];
      child.ref.stderr.on('data', data => stderrCache.push(chalk.redBright(data)));

      const results = await child.promise;

      if ( results.code !== 0 ) {

        new Spinner().fail(chalk.redBright('Could not install local CLI!'));
        console.error(stderrCache.join('\n'));

        process.exit(1);

      }

    }

    // Delegate the command to local CLI
    new Spinner().info(`Using local @singular/cli${chalk.yellow(`@${data.singular.cli}`)}`);

    process.exit((await delegate(localPath, data.projectRoot)).code);

  }

}

/** Invokes the local CLI and passes all arguments to it. */
function delegate(cliPath: string, cwd: string) {

  return spawn(
    'node',
    [
      cliPath,
      ...process.argv.slice(2)
    ],
    {
      windowsHide: true,
      cwd,
      stdio: 'inherit'
    }
  ).promise;

}
