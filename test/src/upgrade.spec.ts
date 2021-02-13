import { expect } from 'chai';
import path from 'path';
import fs from 'fs-extra';
import { ChildProcess } from 'child_process';

describe('upgrade', function() {

  /** Path to verdaccio executable. */
  let verdaccioPath: string;
  /** Currently running verdaccio process. */
  let verdaccioProcess: ChildProcess;

  before('Suite preparation (setting up Singular project and decoys)', async function() {

    // reporter.config({ logs: true });

    this.timeout(300000);

    reporter.progress('Executing "sg new test" command');
    reporter.log('Executing "sg new test" command');

    // Execute "new test" command
    await expect(spawn('node', [sgPath, 'new', 'test']).promise)
    .to.eventually.have.property('code', 0);

    await fs.copyFile(
      path.resolve(__dirname, '..', 'assets', '.npmrc'),
      path.join(testDir, 'test', '.npmrc')
    );

    reporter.progress('Setting up npm registry decoy');
    reporter.log('Setting up npm registry decoy');

    // Install verdaccio locally
    await fs.mkdirp(path.join(testDir, 'verdaccio'));

    await expect(cd('verdaccio').spawn('npm', ['init', '-y']).promise)
    .to.eventually.have.property('code', 0);

    await expect(cd('verdaccio').spawn('npm', ['install', 'verdaccio']).promise)
    .to.eventually.have.property('code', 0);

    await fs.copyFile(
      path.resolve(__dirname, '..', 'assets', '.verdaccio.config.yaml'),
      path.join(testDir, 'verdaccio', '.verdaccio.config.yaml')
    );

    reporter.progress('Creating package decoys');
    reporter.log('Creating package decoys');

    // Create decoys
    const decoys = [
      { dirname: 'core-decoy', packageName: '@singular/core' },
      { dirname: 'validators-decoy', packageName: '@singular/validators' },
      { dirname: 'pipes-decoy', packageName: '@singular/pipes' },
      { dirname: 'cli-decoy', packageName: '@singular/cli' },
      { dirname: 'inc-patch-1-2', packageName: '@singular/inc-patch-1-2' },
      { dirname: 'inc-patch-3-4', packageName: '@singular/inc-patch-3-4' }
    ];

    for ( const decoy of decoys ) {

      await fs.mkdirp(path.join(testDir, decoy.dirname));

      await expect(cd(decoy.dirname).spawn('npm', ['init', '-y']).promise)
      .to.eventually.have.property('code', 0);

      await fs.writeJson(
        path.join(testDir, decoy.dirname, 'package.json'),
        {
          ...fs.readJson(path.join(testDir, decoy.dirname, 'package.json')),
          name: decoy.packageName,
          version: '1.0.0',
          description: 'decoy package',
          author: 'Test',
          main: 'index.js'
        }
      );

      await fs.copyFile(
        path.resolve(__dirname, '..', 'assets', '.npmrc'),
        path.join(testDir, decoy.dirname, '.npmrc')
      );

      await fs.writeFile(
        path.join(testDir, decoy.dirname, 'index.js'),
        `module.exports.apply = async () => console.log('Running patch ${decoy.packageName}');`
      );

    }

    // Set path shortcut
    verdaccioPath = path.join(testDir, 'verdaccio', 'node_modules', 'verdaccio', 'bin', 'verdaccio');

    reporter.progress('Starting npm registry decoy');
    reporter.log('Starting npm registry decoy');

    // Run verdaccio
    verdaccioProcess = cd('verdaccio').spawn('node', [verdaccioPath, '-l', '7003', '-c', './.verdaccio.config.yaml']).ref;

    reporter.progress('Waiting for 8 seconds');
    reporter.log('Waiting for 8 seconds');

    // Allow verdaccio some time to initialize
    await wait(8000);

    reporter.progress('Publishing decoys');
    reporter.log('Publishing decoys');

    // Publish decoys version 1.0.0
    for ( const decoy of decoys ) {

      await expect(cd(decoy.dirname).spawn('npm', ['publish']).promise)
      .to.eventually.have.property('code', 0);

    }

    reporter.progress('Installing decoys in test project');
    reporter.log('Installing decoys in test project');

    // Install decoys
    await expect(cd('test').spawn('npm', ['install', '@singular/core', '@singular/validators', '@singular/pipes']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Updating singular.json');
    reporter.log('Updating singular.json');

    // Update singular.json
    await fs.writeJson(
      path.join(testDir, 'test', 'singular.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'singular.json')),
        cli: '1.0.0'
      }
    );

  });

  after('Suite cleanup (delete test directory)', async function() {

    // reporter.config({ logs: true });

    this.timeout(20000);

    reporter.log('Killing npm registry decoy');

    await kill(verdaccioProcess);

    reporter.log('Removing test and decoy directories');

    // Remove test and decoy directories
    await fs.remove(path.join(testDir, 'test'));
    await fs.remove(path.join(testDir, 'verdaccio'));
    await fs.remove(path.join(testDir, 'cli-decoy'));
    await fs.remove(path.join(testDir, 'core-decoy'));
    await fs.remove(path.join(testDir, 'pipes-decoy'));
    await fs.remove(path.join(testDir, 'validators-decoy'));
    await fs.remove(path.join(testDir, 'inc-patch-1-2'));
    await fs.remove(path.join(testDir, 'inc-patch-3-4'));

  });

  it('should refuse to upgrade from prerelease version', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(180000);

    reporter.progress('Updating singular.json');

    // Update singular.json
    await fs.writeJson(
      path.join(testDir, 'test', 'singular.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'singular.json')),
        cli: '1.0.0-alpha.1'
      }
    );

    reporter.progress('Executing "sg upgrade"');

    // Execute "sg upgrade"
    const child = cd('test').spawn('node', [sgPath, 'upgrade']);
    const stderr: string[] = [];

    child.ref.stderr.on('data', chunk => stderr.push(chunk + ''));

    await expect(child.promise)
    .to.eventually.have.property('code', 1);

    expect(stderr.join('\n')).to.include('Upgrading is disabled for projects made with pre-release versions of Singular.');

    reporter.progress('Restoring singular.json');

    // Update singular.json
    await fs.writeJson(
      path.join(testDir, 'test', 'singular.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'singular.json')),
        cli: '1.0.0'
      }
    );

  });

  it('should refuse to upgrade unaligned modules', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(180000);

    reporter.progress('Updating dependencies');

    // Update dependencies' package.json
    await fs.writeJson(
      path.join(testDir, 'test', 'node_modules', '@singular', 'validators', 'package.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'validators', 'package.json')),
        version: '1.2.0-alpha.1'
      }
    );

    await fs.writeJson(
      path.join(testDir, 'test', 'node_modules', '@singular', 'pipes', 'package.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'pipes', 'package.json')),
        version: '2.0.4'
      }
    );

    reporter.progress('Executing "sg upgrade"');

    // Execute "sg upgrade"
    const child = cd('test').spawn('node', [sgPath, 'upgrade']);
    const stderr: string[] = [];

    child.ref.stderr.on('data', chunk => stderr.push(chunk + ''));

    await expect(child.promise)
    .to.eventually.have.property('code', 1);

    expect(stderr.join('\n')).to.include('Singular dependency @singular/validators is not aligned with project version.');
    expect(stderr.join('\n')).to.include('Singular dependency @singular/pipes is not aligned with project version.');

    reporter.progress('Restoring dependencies');

    // Update dependencies' package.json
    await fs.writeJson(
      path.join(testDir, 'test', 'node_modules', '@singular', 'validators', 'package.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'validators', 'package.json')),
        version: '1.0.0'
      }
    );

    await fs.writeJson(
      path.join(testDir, 'test', 'node_modules', '@singular', 'pipes', 'package.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'pipes', 'package.json')),
        version: '1.0.0'
      }
    );

  });

  it('should upgrade all modules to latest when no major updates are available', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(180000);

    reporter.progress('Publishing @singular/core decoy with version 1.5.2');

    // Publish @singular/core@1.5.2 decoy
    await expect(cd('core-decoy').spawn('npm', ['version', '1.5.2']).promise)
    .to.eventually.have.property('code', 0);

    await expect(cd('core-decoy').spawn('npm', ['publish']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Publishing @singular/pipes decoy with version 1.0.4');

    // Publish @singular/pipes@1.0.4 decoy
    await expect(cd('pipes-decoy').spawn('npm', ['version', '1.0.4']).promise)
    .to.eventually.have.property('code', 0);

    await expect(cd('pipes-decoy').spawn('npm', ['publish']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Executing "sg upgrade"');

    // Execute "sg upgrade"
    await expect(cd('test').spawn('node', [sgPath, 'upgrade']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking module versions');

    // Check all modules versions
    expect(await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'core', 'package.json')))
    .to.have.property('version', '1.5.2');

    expect(await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'validators', 'package.json')))
    .to.have.property('version', '1.0.0');

    expect(await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'pipes', 'package.json')))
    .to.have.property('version', '1.0.4');

  });

  it('should upgrade project and modules incrementally to latest major version while running available patches', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(180000);

    async function publish(name: string, dirname: string, version: string) {

      reporter.progress(`Publishing ${name} decoy with version ${version}`);

      // Publish package
      await expect(cd(dirname).spawn('npm', ['version', version]).promise)
      .to.eventually.have.property('code', 0);

      await expect(cd(dirname).spawn('npm', ['publish']).promise)
      .to.eventually.have.property('code', 0);

    }

    await publish('@singular/core', 'core-decoy', '2.0.0');
    await publish('@singular/core', 'core-decoy', '2.4.0');
    await publish('@singular/core', 'core-decoy', '3.0.1');
    await publish('@singular/core', 'core-decoy', '3.6.0');
    await publish('@singular/core', 'core-decoy', '4.0.9');

    await publish('@singular/validators', 'validators-decoy', '2.0.0');
    await publish('@singular/validators', 'validators-decoy', '3.0.0');
    await publish('@singular/validators', 'validators-decoy', '4.0.0');

    await publish('@singular/pipes', 'pipes-decoy', '2.0.0');
    await publish('@singular/pipes', 'pipes-decoy', '3.0.0');
    await publish('@singular/pipes', 'pipes-decoy', '4.0.0');
    await publish('@singular/pipes', 'pipes-decoy', '4.7.0');

    await publish('@singular/cli', 'cli-decoy', '2.0.0');
    await publish('@singular/cli', 'cli-decoy', '3.0.0');
    await publish('@singular/cli', 'cli-decoy', '4.0.0');

    reporter.progress('Executing "sg upgrade"');

    // Execute "sg upgrade"
    const child = cd('test').spawn('node', [sgPath, 'upgrade']);
    const stdout: string[] = [];
    const stderr: string[] = [];

    child.ref.stdout.on('data', chunk => stdout.push(chunk + ''));
    child.ref.stderr.on('data', chunk => stderr.push(chunk + ''));

    await expect(child.promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking module versions');

    // Check all modules versions
    expect(await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'core', 'package.json')))
    .to.have.property('version', '4.0.9');

    expect(await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'validators', 'package.json')))
    .to.have.property('version', '4.0.0');

    expect(await fs.readJson(path.join(testDir, 'test', 'node_modules', '@singular', 'pipes', 'package.json')))
    .to.have.property('version', '4.7.0');

    reporter.progress('Checking singular.json');

    // Check singular.json
    expect(await fs.readJson(path.join(testDir, 'test', 'singular.json')))
    .to.have.property('cli', '4.0.0');

    // Check stderr
    expect(stderr).to.deep.equal([]);
    expect(stdout.join('\n')).to.include('Running patch @singular/inc-patch-1-2');
    expect(stdout.join('\n')).to.include('Running patch @singular/inc-patch-3-4');

  });

});
