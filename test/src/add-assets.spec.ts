import fs from 'fs-extra';
import path from 'path';
import { expect } from 'chai';
import { hasStructure } from './lib/file-util';

describe('add assets', function() {

  before('Suite preparation (setting up Singular project)', async function() {

    // reporter.config({ logs: true });

    this.timeout(120000);

    reporter.progress('Executing "sg new test" command');
    reporter.log('Executing "sg new test" command');

    // Execute "new test" command
    await expect(spawn('node', [sgPath, 'new', 'test']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Reconfiguring the server to log debug messages to the console');
    reporter.log('Reconfiguring the server to log debug messages to the console');

    // Update server.config.ts
    await fs.writeFile(
      path.join(testDir, 'test', 'src', 'server.config.ts'),
      (await fs.readFile(path.join(testDir, 'test', 'src', 'server.config.ts'), { encoding: 'utf-8' }))
      .replace('dev: {', 'dev: {consoleLogLevels:"all",')
    );

    // Add assets to src
    await fs.writeJson(path.join(testDir, 'test', 'src', 'asset1.json'), { number: 1 });
    await fs.writeJson(path.join(testDir, 'test', 'src', 'asset2.json'), { number: 2 });
    await fs.writeJson(path.join(testDir, 'test', 'src', 'asset3.json'), { number: 3 });

  });

  after('Suite cleanup (delete test directory)', async function() {

    // reporter.config({ logs: true });

    reporter.log('Removing test directory');

    // Remove test directory
    await fs.remove(path.join(testDir, 'test'));

  });

  it('should register assets correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Executing "sg add assets asset1.json"');

    // Execute "sg add assets asset1.json"
    await expect(cd('test').spawn('node', [sgPath, 'add', 'assets', 'asset1.json']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Executing "sg add assets asset2.json asset3.json"');

    // Execute "sg add assets asset2.json asset3.json"
    await expect(cd('test').spawn('node', [sgPath, 'add', 'assets', 'asset2.json', 'asset3.json']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking singular.json');

    // Check singular.json
    expect((await fs.readJson(path.join(testDir, 'test', 'singular.json'))).project.assets)
    .to.have.members([
      'asset1.json',
      'asset2.json',
      'asset3.json'
    ]);

    reporter.progress('Executing "sg build"');

    // Execute "sg build"
    await expect(cd('test').spawn('node', [sgPath, 'build']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking assets in the build');

    hasStructure(path.join(testDir, 'test', 'dist'), [
      'asset1.json',
      'asset2.json',
      'asset3.json'
    ]);

  });

  it('should refuse to register assets outside a Singular project', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    // Execute "sg add assets asset1.json"
    reporter.progress('Executing "sg add assets asset1.json" command');

    const child = spawn('node', [sgPath, 'add', 'assets', 'asset1.json']);
    const errors: string[] = [];

    child.ref.stderr.on('data', chunk => errors.push(chunk + ''));

    await expect(child.promise).to.eventually.have.property('code', 1);
    expect(errors).to.have.lengthOf(1);
    expect(errors[0]).to.include('Could not locate Singular project!');

  });

  it('should refuse to register non-existing assets', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    // Execute "sg add assets asset4.json"
    reporter.progress('Executing "sg add assets asset4.json" command');

    const child = cd('test').spawn('node', [sgPath, 'add', 'assets', 'asset4.json']);
    const errors: string[] = [];

    child.ref.stderr.on('data', chunk => errors.push(chunk + ''));

    await expect(child.promise).to.eventually.have.property('code', 1);
    expect(errors).to.have.lengthOf(1);
    expect(errors[0]).to.include('File doesn\'t exist');

  });

});
