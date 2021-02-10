import fs from 'fs-extra';
import path from 'path';
import { expect } from 'chai';
import request from 'got';
import { wait } from './lib/wait';

describe('docs', function() {

  before('Suite preparation (setting up Singular project)', async function() {

    // reporter.config({ logs: true });

    this.timeout(120000);

    reporter.progress('Executing "sg new test" command');
    reporter.log('Executing "sg new test" command');

    // Execute "new test" command
    await expect(spawn('node', [sgPath, 'new', 'test']).promise)
    .to.eventually.have.property('code', 0);

  });

  after('Suite cleanup (delete test directory)', async function() {

    // reporter.config({ logs: true });

    reporter.log('Removing test directory');

    // Remove test directory
    await fs.remove(path.join(testDir, 'test'));

  });

  it('should generate TypeDoc documentation files correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 10 seconds
    this.timeout(10000);

    reporter.progress('Executing "sg docs"');

    // Execute "sg docs"
    await expect(cd('test').spawn('node', [sgPath, 'docs']).promise)
    .to.eventually.have.property('code', 0);

    await expect(fs.pathExists(path.join(testDir, 'test', 'docs', 'index.html')))
    .to.eventually.be.true;

  });

  it('should generate TypeDoc documentation files and serve on default port correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg docs --serve"');

    // Execute "sg docs --serve"
    const child = cd('test').spawn('node', [sgPath, 'docs', '--serve']);
    const errors: string[] = [];

    child.ref.stderr.on('data', chunk => errors.push(chunk + ''));

    reporter.progress('Waiting for 5 seconds');

    await wait(5000);

    reporter.progress('Sending GET request to http://localhost:6001');

    // Send GET request to http://localhost:6001
    const response = await request.get('http://localhost:6001');

    expect(typeof response.body).to.equal('string');

    reporter.log(errors.join('\n'));

    // Expect no errors
    expect(errors).to.be.empty;

    reporter.progress('Killing the process');

    // Kill the server
    await kill(child.ref);

  });

  it('should generate TypeDoc documentation files and serve on custom port correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg docs --serve --port 6002"');

    // Execute "sg docs --serve --port 6002"
    const child = cd('test').spawn('node', [sgPath, 'docs', '--serve', '--port', '6002']);
    const errors: string[] = [];

    child.ref.stderr.on('data', chunk => errors.push(chunk + ''));

    reporter.progress('Waiting for 5 seconds');

    await wait(5000);

    reporter.progress('Sending GET request to http://localhost:6002');

    // Send GET request to http://localhost:6001
    const response = await request.get('http://localhost:6002');

    expect(typeof response.body).to.equal('string');

    reporter.log(errors.join('\n'));

    // Expect no errors
    expect(errors).to.be.empty;

    reporter.progress('Killing the process');

    // Kill the server
    await kill(child.ref);

  });

});
