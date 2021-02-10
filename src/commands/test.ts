import app from 'argumental';
import { projectGuard } from '../lib/events';
import { build } from '../lib/build';
import { SgData } from '../lib/models';
import { spawn } from '../lib/child-process';
import Spinner from '../lib/spinner';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';

app
.command('test', 'runs the tests')

.option('--skip-build', 'skips building the test files')
.option('--skip-server-build', 'skips building the server source files')
.option('-d --dry-run', 'shorthand for --skip-build and --skip-server-build')
.option('-m --minify', 'minifies the server build')
.option('-p --profile <config_profile>', 'sets the config profile before launching the server (defaults to test)')
.validate(app.STRING)

// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.actionDestruct(async ({ opts }) => {

  const spinner = new Spinner();

  // If tests are disabled for this project
  if ( ! app.data<SgData>().singular.project.tests ) {

    spinner.fail('Tests are disabled on this project!');
    return;

  }

  // Build the server
  if ( ! opts.skipServerBuild && ! opts.dryRun ) {

    await build(app.data<SgData>(), opts.minify);

  }

  // Build the tests
  if ( ! opts.skipBuild && ! opts.dryRun ) {

    // Clean up
    spinner.start('Cleaning up');

    await fs.remove(path.resolve(app.data<SgData>().projectRoot, 'test', 'dist'));

    spinner.succeed();

    // Build the test source
    spinner.start('Building tests');

    const child = spawn(
      'node',
      [
        path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
        '-p',
        path.join('.', 'test', 'tsconfig.json')
      ],
      {
        windowsHide: true,
        cwd: path.join(app.data<SgData>().projectRoot),
        stdio: ['ignore', 'ignore', 'pipe']
      }
    );

    const stderrCache: string[] = [];
    child.ref.stderr.on('data', data => stderrCache.push(chalk.redBright(data)));

    const results = await child.promise;

    if ( results.code !== 0 ) {

      spinner.fail(chalk.redBright('Build failed!'));
      console.error(stderrCache.join('\n'));

      process.exit(1);

    }

    spinner.succeed('Tests were built');

  }

  // Set config profile
  process.env.SINGULAR_CONFIG_PROFILE = opts.profile ?? 'test';

  // Run tests
  spinner.info(chalk.blueBright(`Tests are being run`));

  spawn(
    'node',
    [
      path.join('.', 'node_modules', 'mocha', 'bin', 'mocha'),
      path.join('.', 'test', 'dist', 'main.spec.js')
    ],
    {
      windowsHide: true,
      cwd: app.data<SgData>().projectRoot,
      stdio: 'inherit'
    }
  );

});
