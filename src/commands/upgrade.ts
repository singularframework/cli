import app from 'argumental';
import { spawn } from '../lib/child-process';
import { getInstalledVersion } from '../lib/packages';
import { projectGuard, saveSingularJson } from '../lib/events';
import { SgData } from '../lib/models';
import Spinner from '../lib/spinner';
import path from 'path';
import semver from 'semver';
import chalk from 'chalk';

/** Returns the major version number. */
function getMajor(version: string): number {

  return version ? semver.major(version) : null;

}

/** Returns all non-prerelease versions of a package on npm. */
async function getVersions(packageName: string, projectRoot: string): Promise<string[]> {

  const npmViewChild = spawn('npm', ['view', packageName, 'versions'], {
    windowsHide: true,
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let npmViewChildStdout: string;
  const npmViewChildStderrCache: string[] = [];

  npmViewChild.ref.stdout.on('data', chunk => npmViewChildStdout = chunk + '');
  npmViewChild.ref.stderr.on('data', data => npmViewChildStderrCache.push(chalk.redBright(data)));

  const npmViewChildResults = await npmViewChild.promise;

  if ( npmViewChildResults.code !== 0 ) {

    throw new Error(npmViewChildStderrCache.join('\n'));

  }

  // Parse stdout result
  const packageVersions: string[] = JSON.parse(npmViewChildStdout.replace(/'/g, '"'))
  // Filter prereleases out
  .filter(v => ! semver.prerelease(v));

  return packageVersions;

}

/** Returns the greatest version of each next major for a package. */
async function getIncrementalVersions(
  packageName: string,
  projectRoot: string,
  projectVersion: string
): Promise<string[]> {

  // Get all versions of package
  let versions: string[] = await getVersions(packageName, projectRoot);

  // Get next versions
  let nextVersions: any = {};

  versions
  // Filter old versions
  .filter(v => getMajor(v) > getMajor(projectVersion))
  // Create a map of versions in nextVersions (grouped by major)
  .map(v => {

    const major = getMajor(v);

    if ( ! nextVersions.hasOwnProperty(major) ) nextVersions[major] = [];

    nextVersions[major].push(v);

  });

  // Keep the greatest version of each major
  const incrementals: string[] = [];

  for ( const major in nextVersions ) {

    incrementals.push(<string>semver.sort(nextVersions[major]).pop());

  }

  return semver.sort(incrementals);

}

app
.command('upgrade', 'upgrades Singular framework to the latest version')

.on('actions:before', projectGuard)
.on('actions:after', saveSingularJson)

.action(async () => {

  const spinner = new Spinner();
  const data = app.data<SgData>();
  const projectVersion = data.singular.cli;

  spinner.start('Checking upgrade prerequisites');

  // Check if target is a prerelease
  if ( semver.prerelease(projectVersion) ) {

    spinner.fail();
    spinner.warn(chalk.yellow(`Upgrading is disabled for projects made with pre-release versions of Singular.`));

    process.exit(1);

  }

  // Check if all modules have the same major as project's CLI
  const unaligned = [
    { name: '@singular/core', version: await getInstalledVersion(data.projectRoot, '@singular/core') },
    { name: '@singular/validators', version: await getInstalledVersion(data.projectRoot, '@singular/validators') },
    { name: '@singular/pipes', version: await getInstalledVersion(data.projectRoot, '@singular/pipes') }
  ]
  // Filter out uninstalled packages
  .filter(module => !! module.version)
  // Keep unaligned modules and prereleases
  .filter(module => !! semver.prerelease(module.version) || getMajor(module.version) !== getMajor(projectVersion));

  // Exit with instructions if unaligned package was found
  if ( unaligned.length ) {

    spinner.fail();

    for ( const module of unaligned ) {

      spinner.warn(chalk.yellow(
        `Singular dependency ${chalk.blueBright.bold(module.name)} is not aligned with project version.\n  ` +
        `Please run: ${chalk.white.bold(`npm install ${module.name}@"<${semver.inc(projectVersion, 'major')}"`)}`
      ));

    }

    process.exit(1);

  }

  spinner.succeed();

  spinner.start('Checking for updates');

  // Get incremental versions
  const incremental: any = {};

  try {

    incremental['@singular/core'] = await getIncrementalVersions('@singular/core', data.projectRoot, projectVersion);
    incremental['@singular/validators'] = await getIncrementalVersions('@singular/validators', data.projectRoot, projectVersion);
    incremental['@singular/pipes'] = await getIncrementalVersions('@singular/pipes', data.projectRoot, projectVersion);
    incremental['@singular/cli'] = await getIncrementalVersions('@singular/cli', data.projectRoot, projectVersion);

  }
  catch (error) {

    spinner.fail();
    console.error(error.message);

    process.exit(1);

  }

  spinner.succeed();

  // If no major updates, install all modules @latest and exit
  if ( ! incremental['@singular/core'].length ) {

    spinner.start('Updating modules to the latest minor version');

    const npmInstallChild = spawn('npm', ['install', '@singular/core@latest', '@singular/validators@latest', '@singular/pipes@latest'], {
      windowsHide: true,
      cwd: data.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const npmInstallChildStderrCache: string[] = [];

    npmInstallChild.ref.stderr.on('data', data => npmInstallChildStderrCache.push(chalk.redBright(data)));

    const npmInstallChildResults = await npmInstallChild.promise;

    if ( npmInstallChildResults.code !== 0 ) {

      spinner.fail();
      console.error(npmInstallChildStderrCache.join('\n'));

      process.exit(1);

    }

    spinner.succeed();

    return;

  }

  // Upgrade to next majors incrementally
  for ( let i = 0; i < incremental['@singular/core'].length; i++ ) {

    spinner.start(`Upgrading to Singular ${getMajor(incremental['@singular/core'][i])}`);

    // Install next major version of all modules
    const npmInstallChild = spawn('npm', [
      'install',
      `@singular/core@${incremental['@singular/core'][i]}`,
      `@singular/validators@${incremental['@singular/validators'][i]}`,
      `@singular/pipes@${incremental['@singular/pipes'][i]}`
    ], {
      windowsHide: true,
      cwd: data.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const npmInstallChildStderrCache: string[] = [];

    npmInstallChild.ref.stderr.on('data', data => npmInstallChildStderrCache.push(chalk.redBright(data)));

    const npmInstallChildResults = await npmInstallChild.promise;

    if ( npmInstallChildResults.code !== 0 ) {

      spinner.fail();
      console.error(npmInstallChildStderrCache.join('\n'));

      process.exit(1);

    }

    // Install patch (if any)
    const npmPatchInstallChild = spawn('npm', [
      'install',
      `@singular/inc-patch-${getMajor(incremental['@singular/core'][i]) - 1}-${getMajor(incremental['@singular/core'][i])}`
    ], {
      windowsHide: true,
      cwd: data.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const npmPatchChildStderrCache: string[] = [];

    npmPatchInstallChild.ref.stderr.on('data', data => npmPatchChildStderrCache.push(chalk.redBright(data)));

    const npmPatchChildResults = await npmPatchInstallChild.promise;

    // If error and not E404 (patch not found error is okay)
    if ( npmPatchChildResults.code !== 0 ) {

      if ( npmPatchChildStderrCache.join('\n').includes('is not in the npm registry') ) {

        spinner.succeed();
        continue;

      }

      spinner.fail();
      console.error(npmPatchChildStderrCache.join('\n'));

      process.exit(1);

    }

    // Update singular.json
    app.data<SgData>().singular.cli = incremental['@singular/cli'][i];
    await saveSingularJson(<any>{});

    spinner.stop();

    // Apply patch
    try {

      const patch = await import(path.join(data.projectRoot, 'node_modules', '@singular', `inc-patch-${getMajor(incremental['@singular/core'][i]) - 1}-${getMajor(incremental['@singular/core'][i])}`));

      await patch.apply(app.data());

    }
    catch (error) {

      spinner.fail();
      console.error('Could not apply patch!\n' + error);

      process.exit(1);

    }

    spinner.succeed(`Upgrading to Singular ${getMajor(incremental['@singular/core'][i])}`);

  }

});
