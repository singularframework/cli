import { ChildProcess } from 'child_process';
import { expect } from 'chai';
import path from 'path';
import fs from 'fs-extra';

describe('version control', function() {

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
      { dirname: 'cli-decoy', packageName: '@singular/cli' }
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
          version: '2.0.0',
          description: 'decoy package',
          author: 'Test',
          main: 'bin/sg.js'
        }
      );

      await fs.copyFile(
        path.resolve(__dirname, '..', 'assets', '.npmrc'),
        path.join(testDir, decoy.dirname, '.npmrc')
      );

      await fs.mkdirp(path.join(testDir, decoy.dirname, 'bin'));

      await fs.writeFile(
        path.join(testDir, decoy.dirname, 'bin', 'sg.js'),
        `console.log('DELEGATED', ...process.argv.slice(2));`
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

    // Publish decoys version 2.0.0
    for ( const decoy of decoys ) {

      await expect(cd(decoy.dirname).spawn('npm', ['publish']).promise)
      .to.eventually.have.property('code', 0);

    }

    reporter.progress('Updating singular.json');
    reporter.log('Updating singular.json');

    // Update singular.json
    await fs.writeJson(
      path.join(testDir, 'test', 'singular.json'),
      {
        ...await fs.readJson(path.join(testDir, 'test', 'singular.json')),
        cli: '2.0.0'
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

  it('should install and delegate arguments to the correct CLI version locally', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(180000);

    reporter.progress('Executing "sg generate router test"');

    // Execute "sg generate router test"
    const child = cd('test').spawn('node', [sgPath, 'generate', 'router', 'test']);
    const stdout: string[] = [];
    const stderr: string[] = [];

    child.ref.stdout.on('data', chunk => stdout.push(chunk + ''));
    child.ref.stderr.on('data', chunk => stderr.push(chunk + ''));

    await expect(child.promise)
    .to.eventually.have.property('code', 0);

    expect(stderr.join('\n')).to.include('This project was generated using an incompatible CLI version! A local version will be installed and used instead');
    expect(stdout.join('\n')).to.include('DELEGATED generate router test');

  });

});
