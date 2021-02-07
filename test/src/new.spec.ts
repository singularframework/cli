import { hasStructure } from './lib/file-util';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs-extra';

describe('new', function() {

  afterEach(async function() {

    await fs.remove(path.join(testDir, 'test'));

  });

  it('should scaffold new project correctly', async function() {

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
    await expect(spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ], {
      cwd: path.join(testDir, 'test')
    }).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

    reporter.progress('Running the server');

    // Run the server
    const server = spawn('node', [path.join('.', 'dist', 'main.js')], { cwd: path.join(testDir, 'test') });
    let threwError: string = null;

    // Watchout for errors
    server.ref.stderr.on('data', (data) => threwError = data + '');

    reporter.progress('Waiting 5 seconds for the server to fully initialize');

    // Give the server some time to initialize
    await wait(5000);

    // Expect no errors
    expect(threwError, 'Server threw error!').to.be.null;

    reporter.progress('Killing the server process');

    // Kill the server
    await kill(server.ref.pid);

  });

});
