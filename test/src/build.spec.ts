import { hasStructure } from './lib/file-util';
import { LogParser, LogParserClass } from './lib/log-parser';
import fs from 'fs-extra';
import path from 'path';
import { expect } from 'chai';

describe('build', function() {

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
      .replace(/prod: {.+?}/s, 'prod: {port:5001,consoleLogLevels:"all"},custom:{port:6003,consoleLogLevels:"all"}')
    );

    // Update main.ts to register 'custom' profile
    await fs.writeFile(
      path.join(testDir, 'test', 'src', 'main.ts'),
      (await fs.readFile(path.join(testDir, 'test', 'src', 'main.ts'), { encoding: 'utf-8' }))
      .replace('.launch', '.config(\'custom\', profiles.custom).launch')
    );

  });

  after('Suite cleanup (delete test directory)', async function() {

    // reporter.config({ logs: true });

    reporter.log('Removing test directory');

    // Remove test directory
    await fs.remove(path.join(testDir, 'test'));

  });

  it('should build the server correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Executing "sg build"');

    // Execute "sg build"
    await expect(cd('test').spawn('node', [sgPath, 'build']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking the build for no minifications');

    // Check main.js for new lines (not minified)
    expect(
      (await fs.readFile(path.join(testDir, 'test', 'dist', 'main.js'), { encoding: 'utf-8' }))
      .match(/\n/g).length
    ).to.be.greaterThan(1);

    reporter.progress('Running the server');

    // Run the server
    const server = cd('test').spawn('node', [path.join('.', 'dist', 'main.js')]);
    const logs: LogParser = new LogParserClass(server.ref);
    const warns: string[] = [];
    const errors: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors nor warnings
    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should build the server correctly with minification', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Executing "sg build --minify"');

    // Execute "sg build --minify"
    await expect(cd('test').spawn('node', [sgPath, 'build', '--minify']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking the build for minifications');

    // Check main.js for no new lines (minified)
    expect(
      (await fs.readFile(path.join(testDir, 'test', 'dist', 'main.js'), { encoding: 'utf-8' }))
      .match(/\n/g).length
    ).to.be.not.greaterThan(1);

    reporter.progress('Running the server');

    // Run the server
    const server = cd('test').spawn('node', [path.join('.', 'dist', 'main.js')]);
    const logs: LogParser = new LogParserClass(server.ref);
    const warns: string[] = [];
    const errors: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors nor warnings
    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should build the server correctly as a standalone', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg build --standalone"');

    // Execute "sg build --standalone"
    await expect(cd('test').spawn('node', [sgPath, 'build', '--standalone']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking build structure');

    hasStructure(path.join(testDir, 'test', 'dist'), [
      'main.js',
      'server.config.js',
      'tsconfig.json',
      'package.json',
      '.gitignore'
    ], true);

    reporter.progress('Manually installing dependencies');

    // Install dependencies
    await expect(cd('test/dist').spawn('npm', ['install']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Running the server');

    // Run the server
    const server = cd('test/dist').spawn('node', [path.join('main.js')]);
    const logs: LogParser = new LogParserClass(server.ref);
    const warns: string[] = [];
    const errors: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors nor warnings
    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should build the server with a forced config profile correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Executing "sg build --profile custom"');

    // Execute "sg build --profile custom"
    await expect(cd('test').spawn('node', [sgPath, 'build', '--profile', 'custom']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Running the server');

    // Run the server
    const server = cd('test').spawn('node', [path.join('.', 'dist', 'main.js')]);
    const logs: LogParser = new LogParserClass(server.ref);
    const warns: string[] = [];
    const errors: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    const notice = (await logs.next('startup', 'notice')).text;

    reporter.log('Got server notice', notice);

    // Expect exact port number
    expect(notice).to.include('6003');

    // Expect no errors nor warnings
    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should build the server for production correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Executing "sg build --prod"');

    // Execute "sg build --prod"
    await expect(cd('test').spawn('node', [sgPath, 'build', '--prod']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking the build for minifications');

    // Check main.js for no new lines (minified)
    expect(
      (await fs.readFile(path.join(testDir, 'test', 'dist', 'main.js'), { encoding: 'utf-8' }))
      .match(/\n/g).length
    ).to.be.not.greaterThan(1);

    reporter.progress('Running the server');

    // Run the server
    const server = cd('test').spawn('node', [path.join('.', 'dist', 'main.js')]);
    const logs: LogParser = new LogParserClass(server.ref);
    const warns: string[] = [];
    const errors: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    const notice = (await logs.next('startup', 'notice')).text;

    reporter.log('Got server notice', notice);

    // Expect exact port number
    expect(notice).to.include('5001');

    // Expect no errors nor warnings
    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should build the server correctly in a custom directory for production', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Removing previous builds (if any)');

    // Remove dist
    await fs.remove(path.join(testDir, 'test', 'dist'));

    reporter.progress('Executing "sg build --prod --out-dir ../custom-build"');

    // Execute "sg build --prod --out-dir ../custom-build"
    await expect(cd('test').spawn('node', [sgPath, 'build', '--prod', '--out-dir', '../custom-build']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking output');

    // Check for .playground/custom-build/main.js
    expect(fs.pathExists(path.join(testDir, 'custom-build', 'main.js')))
    .to.eventually.be.true;

    reporter.progress('Removing custom-build directory');

    // Remove 'custom-build' directory
    await fs.remove(path.join(testDir, 'custom-build'));

  });

  it('should refuse building outside of a Singular project', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    // Execute "sg build"
    reporter.progress('Executing "sg build" command');

    const child = spawn('node', [sgPath, 'build']);
    const errors: string[] = [];

    child.ref.stderr.on('data', chunk => errors.push(chunk + ''));

    await expect(child.promise).to.eventually.have.property('code', 1);
    expect(errors).to.have.lengthOf(1);
    expect(errors[0]).to.include('Could not locate Singular project!');

  });

});
