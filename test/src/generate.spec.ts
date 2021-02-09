import { pathsExist } from './lib/file-util';
import { LogParser, LogParserClass } from './lib/log-parser';
import fs from 'fs-extra';
import path from 'path';
import { expect } from 'chai';

describe('generate', function() {

  before('Suite preparation (setting up Singular project)', async function() {

    // reporter.config({ logs: true });

    this.timeout(60000);

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

  });

  after('Suite cleanup (delete test directory)', async function() {

    reporter.log('Removing test directory');

    // Remove test directory
    await fs.remove(path.join(testDir, 'test'));

  });

  it('should generate router component correctly', async function() {

    // reporter.config({ logs: true });

    this.timeout(60000);

    reporter.progress('Executing "sg generate router test"');

    // Execute "sg generate router test"
    await expect(cd('test').spawn('node', [sgPath, 'generate', 'router', 'test']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking file structure');

    reporter.log([
      'ls /test/src',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src')))
    ].join('\n'));

    // Check component file
    await expect(pathsExist(path.join('test', 'src', 'routers')))
    .to.eventually.be.true;

    reporter.log([
      'ls /test/src/routers',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src', 'routers')))
    ].join('\n'));

    await expect(pathsExist(path.join('test', 'src', 'routers', 'test.router.ts')))
    .to.eventually.be.true;

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
    const debugs: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));
    logs.on('debug', log => debugs.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors, one warning, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(debugs).to.include('Router "test" was initialized');
    expect(warns).to.have.lengthOf(1).and.include('Router "test" has no defined routes!');
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

    // Delete router (because the server will throw warning in other test cases)
    reporter.progress('Deleting router component');

    await fs.remove(path.join(testDir, 'test', 'src', 'routers', 'test.router.ts'));
    await fs.remove(path.join(testDir, 'test', 'dist', 'routers', 'test.router.js'));

  });

  it('should generate service component correctly', async function() {

    // reporter.config({ logs: true });

    this.timeout(60000);

    reporter.progress('Executing "sg generate service test"');

    // Execute "sg generate service test"
    await expect(cd('test').spawn('node', [sgPath, 'generate', 'service', 'test']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking file structure');

    reporter.log([
      'ls /test/src',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src')))
    ].join('\n'));

    // Check component file
    await expect(pathsExist(path.join('test', 'src', 'services')))
    .to.eventually.be.true;

    reporter.log([
      'ls /test/src/services',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src', 'services')))
    ].join('\n'));

    await expect(pathsExist(path.join('test', 'src', 'services', 'test.service.ts')))
    .to.eventually.be.true;

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
    const debugs: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));
    logs.on('debug', log => debugs.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors nor warnings, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(debugs).to.include('Service "test" was initialized');
    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should generate interceptor component correctly', async function() {

    // reporter.config({ logs: true });

    this.timeout(60000);

    reporter.progress('Executing "sg generate interceptor test"');

    // Execute "sg generate interceptor test"
    await expect(cd('test').spawn('node', [sgPath, 'generate', 'interceptor', 'test']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking file structure');

    reporter.log([
      'ls /test/src',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src')))
    ].join('\n'));

    // Check component file
    await expect(pathsExist(path.join('test', 'src', 'interceptors')))
    .to.eventually.be.true;

    reporter.log([
      'ls /test/src/interceptors',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src', 'interceptors')))
    ].join('\n'));

    await expect(pathsExist(path.join('test', 'src', 'interceptors', 'test.interceptor.ts')))
    .to.eventually.be.true;

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
    const debugs: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));
    logs.on('debug', log => debugs.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors nor warnings, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(debugs).to.include('Interceptor "test" installed');
    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should generate plugin component correctly', async function() {

    // reporter.config({ logs: true });

    this.timeout(60000);

    reporter.progress('Executing "sg generate plugin test"');

    // Execute "sg generate plugin test"
    await expect(cd('test').spawn('node', [sgPath, 'generate', 'plugin', 'test']).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Checking file structure');

    reporter.log([
      'ls /test/src',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src')))
    ].join('\n'));

    // Check component file
    await expect(pathsExist(path.join('test', 'src', 'plugins')))
    .to.eventually.be.true;

    reporter.log([
      'ls /test/src/plugins',
      ...(await fs.promises.readdir(path.join(testDir, 'test', 'src', 'plugins')))
    ].join('\n'));

    await expect(pathsExist(path.join('test', 'src', 'plugins', 'test.plugin.ts')))
    .to.eventually.be.true;

    // Edit plugin
    await fs.writeFile(
      path.join(testDir, 'test', 'src', 'plugins', 'test.plugin.ts'),
      (await fs.readFile(path.join(testDir, 'test', 'src', 'plugins', 'test.plugin.ts'), { encoding: 'utf-8' }))
      .replace(
        'beforeLaunch(log: PluginLogger, data: PluginDataBeforeLaunch): void { }',
        'beforeLaunch(log: PluginLogger, data: PluginDataBeforeLaunch): void { log.debug("Plugin working"); }'
      )
    );

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
    const debugs: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));
    logs.on('debug', log => debugs.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    reporter.log('Got server notice', (await logs.next('startup', 'notice')).text);

    // Expect no errors nor warnings, and specific debug messages
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(debugs).to.include('Plugin "test" was installed');
    expect(debugs).to.include('Plugin working');
    expect(warns).to.be.empty;
    expect(errors).to.be.empty;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

});
