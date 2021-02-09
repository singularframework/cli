import { hasStructure } from './lib/file-util';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs-extra';
import { LogParserClass, LogParser } from './lib/log-parser';

describe('new', function() {

  afterEach('Test case cleanup (delete test directory)', async function() {

    reporter.log('Removing test directory');

    // Remove test directory
    await fs.remove(path.join(testDir, 'test'));

  });

  it('should scaffold new complete project correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      '.git',
      '.gitignore',
      'node_modules',
      'package.json',
      'package-lock.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json',
      'test',
      'test/tsconfig.json',
      'test/src',
      'test/src/main.spec.ts',
      'test/src/feature.spec.ts',
      'test/src/lib',
      'test/src/lib/typings.d.ts',
      'test/src/lib/log-parser.ts',
      'test/src/lib/request.ts'
    ], true);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

  it('should scaffold new project correctly without git setup', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new --skip-git" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test', '--skip-git']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      'node_modules',
      'package.json',
      'package-lock.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json',
      'test',
      'test/tsconfig.json',
      'test/src',
      'test/src/main.spec.ts',
      'test/src/feature.spec.ts',
      'test/src/lib',
      'test/src/lib/typings.d.ts',
      'test/src/lib/log-parser.ts',
      'test/src/lib/request.ts'
    ], true);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

  it('should scaffold new project correctly without npm setup', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new --skip-npm" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test', '--skip-npm']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      '.git',
      '.gitignore',
      'package.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json',
      'test',
      'test/tsconfig.json',
      'test/src',
      'test/src/main.spec.ts',
      'test/src/feature.spec.ts',
      'test/src/lib',
      'test/src/lib/typings.d.ts',
      'test/src/lib/log-parser.ts',
      'test/src/lib/request.ts'
    ], true);

    reporter.progress('Manually installing npm dependencies');

    await expect(cd('test').spawn('npm', ['install']).promise).to.eventually.have.property('code', 0);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

  it('should scaffold new project correctly without test setup', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new --skip-tests" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test', '--skip-tests']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      '.git',
      '.gitignore',
      'node_modules',
      'package.json',
      'package-lock.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json',
    ], true);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

    reporter.progress('Checking singular.json');

    // Check singular.json
    await expect(fs.readJson(path.join(testDir, 'test', 'singular.json'))).to.eventually.have.property('project').that.has.property('tests').that.is.false;

  });

  it('should scaffold new project correctly without docs', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new --skip-docs" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test', '--skip-docs']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      '.git',
      '.gitignore',
      'node_modules',
      'package.json',
      'package-lock.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json',
      'test',
      'test/tsconfig.json',
      'test/src',
      'test/src/main.spec.ts',
      'test/src/feature.spec.ts',
      'test/src/lib',
      'test/src/lib/typings.d.ts',
      'test/src/lib/log-parser.ts',
      'test/src/lib/request.ts'
    ], true);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

    reporter.progress('Checking singular.json');

    // Check singular.json
    await expect(fs.readJson(path.join(testDir, 'test', 'singular.json'))).to.eventually.have.property('project').that.has.property('docs').that.is.false;

  });

  it('should scaffold new project correctly with flat structure', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new --flat" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test', '--flat']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      '.git',
      '.gitignore',
      'node_modules',
      'package.json',
      'package-lock.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json',
      'test',
      'test/tsconfig.json',
      'test/src',
      'test/src/main.spec.ts',
      'test/src/feature.spec.ts',
      'test/src/lib',
      'test/src/lib/typings.d.ts',
      'test/src/lib/log-parser.ts',
      'test/src/lib/request.ts'
    ], true);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

    reporter.progress('Checking singular.json');

    // Check singular.json
    await expect(fs.readJson(path.join(testDir, 'test', 'singular.json'))).to.eventually.have.property('project').that.has.property('flat').that.is.true;

  });

  it('should scaffold new project correctly with all flags', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 3 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg new --flat --skip-tests --skip-npm --skip-git --skip-docs" command');

    // Execute sg new
    await expect(spawn('node', [sgPath, 'new', 'test', '--flat', '--skip-tests', '--skip-npm', '--skip-git', '--skip-docs']).promise, 'New project threw error!').to.eventually.have.property('code', 0);

    reporter.progress('Checking project structure');

    // Check project structure
    hasStructure(path.join(testDir, 'test'), [
      'package.json',
      'src',
      'src/main.ts',
      'src/server.config.ts',
      'src/tsconfig.json',
      'README.md',
      'singular.json'
    ], true);

    reporter.progress('Manually installing npm dependencies');

    await expect(cd('test').spawn('npm', ['install']).promise).to.eventually.have.property('code', 0);

    reporter.progress('Building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

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

    reporter.progress('Checking singular.json');

    // Check singular.json
    await expect(fs.readJson(path.join(testDir, 'test', 'singular.json'))).to.eventually.have.property('project').that.deep.equals({
      "name": "test",
      "tests": false,
      "docs": false,
      "flat": true,
      "assets": []
    });

  });

});
