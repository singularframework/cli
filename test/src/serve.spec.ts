import { expect } from 'chai';
import path from 'path';
import fs from 'fs-extra';
import { LogParser, LogParserClass } from './lib/log-parser';

describe('serve', function() {

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

  it('should build and run the server correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg serve"');

    // Execute "sg serve"
    const server = cd('test').spawn('node', [sgPath, 'serve']);
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
    const notice = (await logs.next('startup', 'notice')).text;

    reporter.log('Got server notice', notice);

    // Expect no errors, one warning, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
    expect(notice).to.include('port 5000');

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should build and run the server correctly with a custom config profile', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg serve --profile custom"');

    // Execute "sg serve --profile custom"
    const server = cd('test').spawn('node', [sgPath, 'serve', '--profile', 'custom']);
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
    const notice = (await logs.next('startup', 'notice')).text;

    reporter.log('Got server notice', notice);

    // Expect no errors, one warning, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
    expect(notice).to.include('port 6003');

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

  });

  it('should run the server correctly without building the source', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Manually building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise)
    .to.eventually.have.property('code', 0);

    reporter.progress('Adding service');

    // Write new router
    await fs.writeFile(
      path.join(testDir, 'test', 'src', 'test.service.ts'),
      "import {Service} from '@singular/core';\n" +
      "@Service({name:'test'})\n" +
      "export class TestService {" +
      "onInit() { log.error('SERVICE INSTALLED!'); }\n" +
      "}"
    );

    reporter.progress('Executing "sg serve --skip-build"');

    // Execute "sg serve --skip-build"
    const server = cd('test').spawn('node', [sgPath, 'serve', '--skip-build']);
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
    const notice = (await logs.next('startup', 'notice')).text;

    reporter.log('Got server notice', notice);

    // Expect no errors, one warning, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    expect(warns).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
    expect(notice).to.include('port 5000');

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

    // Remove service
    await fs.remove(path.join(testDir, 'test', 'src', 'test.service.ts'));

  });

  it('should run the server correctly with hot reloading', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Adding service');

    // Write new router
    await fs.writeFile(
      path.join(testDir, 'test', 'src', 'test.service.ts'),
      "import {Service} from '@singular/core';\n" +
      "@Service({name:'test'})\n" +
      "export class TestService {" +
      "onInit() { log.info('TEST_SERVICE_INIT_V1'); }\n" +
      "}"
    );

    reporter.progress('Executing "sg serve --watch"');

    // Execute "sg serve --watch"
    const server = cd('test').spawn('node', [sgPath, 'serve', '--watch']);
    const logs: LogParser = new LogParserClass(server.ref);
    let warns: string[] = [];
    let errors: string[] = [];
    let debugs: string[] = [];
    let infos: string[] = [];

    // Listen to warnings and errors
    logs.on('warn', log => warns.push(log.text));
    logs.on('error', log => errors.push(log.text));
    logs.on('debug', log => debugs.push(log.text));
    logs.on('info', log => infos.push(log.text));

    reporter.progress('Waiting for server to initialize');

    // Wait for the startup notice
    let notice = (await logs.next('startup', 'notice')).text;

    reporter.log('Got server notice', notice);

    // Expect no errors, one warning, and specific debug message
    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    reporter.log('Server infos:', infos.length);
    infos.forEach(text => reporter.log(text));

    expect(warns).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
    expect(notice).to.include('port 5000');
    expect(infos).to.include('TEST_SERVICE_INIT_V1');

    // Reset logs
    warns = [];
    errors = [];
    debugs = [];
    infos = [];
    notice = null;

    reporter.progress('Changing test service');

    // Change the service file
    await fs.writeFile(
      path.join(testDir, 'test', 'src', 'test.service.ts'),
      (await fs.readFile(path.join(testDir, 'test', 'src', 'test.service.ts'), { encoding: 'utf-8' }))
      .replace('TEST_SERVICE_INIT_V1', 'TEST_SERVICE_INIT_V2')
    );

    reporter.progress('Waiting for the next startup notice');

    // Wait for the next notice
    notice = (await logs.toPromise('notice')).text;

    reporter.log('Got server notice', notice);

    reporter.log('Server debugs:', debugs.length);
    debugs.forEach(text => reporter.log(text));

    reporter.log('Server warns:', warns.length);
    warns.forEach(text => reporter.warn(text));

    reporter.log('Server errors:', errors.length);
    errors.forEach(text => reporter.error(text));

    reporter.log('Server infos:', infos.length);
    infos.forEach(text => reporter.log(text));

    expect(warns).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
    expect(notice).to.include('port 5000');
    expect(infos).to.include('TEST_SERVICE_INIT_V2');

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref);

    // Remove service
    await fs.remove(path.join(testDir, 'test', 'src', 'test.service.ts'));

  });

});
