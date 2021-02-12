import fs from 'fs-extra';
import path from 'path';
import { expect } from 'chai';

describe('test', function() {

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

  it('should run tests correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg test"');

    // Execute "sg test"
    await expect(cd('test').spawn('node', [sgPath, 'test']).promise)
    .to.eventually.have.property('code', 0);

  });

  it('should run tests with a custom config profile correctly', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Adjusting main spec');

    const originalMainSpec = await fs.readFile(path.join(testDir, 'test', 'test', 'src', 'main.spec.ts'), { encoding: 'utf-8' });

    // Inject code into test/src/main.spec.ts
    await fs.writeFile(
      path.join(testDir, 'test', 'test', 'src', 'main.spec.ts'),
      'console.log("SINGULAR_CONFIG_PROFILE =", process.env.SINGULAR_CONFIG_PROFILE);\n' +
      originalMainSpec
    );

    reporter.progress('Executing "sg test --profile dev"');

    // Execute "sg test --profile dev"
    const child = cd('test').spawn('node', [sgPath, 'test', '--profile', 'dev']);
    let stdoutCache: string = '';

    child.ref.stdout.on('data', chunk => stdoutCache += chunk);

    await expect(child.promise).to.eventually.have.property('code', 0);
    expect(stdoutCache).to.include('SINGULAR_CONFIG_PROFILE = dev');

    reporter.progress('Restoring original main.spec.ts');

    // Restore original main.spec.ts
    await fs.writeFile(path.join(testDir, 'test', 'test', 'src', 'main.spec.ts'), originalMainSpec);

  });

  // This test is bound to the previous test (relies on code injection)
  it('should run tests correctly without building the test source', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Executing "sg test --skip-build"');

    // Execute "sg test --skip-build"
    const child = cd('test').spawn('node', [sgPath, 'test', '--skip-build']);
    let stdoutCache: string = '';

    child.ref.stdout.on('data', chunk => stdoutCache += chunk);

    await expect(child.promise).to.eventually.have.property('code', 0);
    // Expect previous build to run
    expect(stdoutCache).to.include('SINGULAR_CONFIG_PROFILE = test');

  });

  it('should run tests correctly without building the server', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Manually building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

    reporter.progress('Executing "sg test --skip-server-build"');

    // Execute "sg test --skip-server-build"
    const child = cd('test').spawn('node', [sgPath, 'test', '--skip-server-build']);
    let stdoutCache: string = '';

    child.ref.stdout.on('data', chunk => stdoutCache += chunk);

    await expect(child.promise).to.eventually.have.property('code', 0);
    expect(stdoutCache).to.not.include('Building the server');

  });

  it('should run tests correctly on a dry run', async function() {

    // reporter.config({ logs: true });

    // Set timeout to 2 minutes
    this.timeout(120000);

    reporter.progress('Manually building the server');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ]).promise, 'Server build failed!')
    .to.eventually.not.be.rejected;

    reporter.progress('Manually building tests');

    // Build the server
    await expect(cd('test').spawn('node', [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'test', 'tsconfig.json')
    ]).promise, 'Test build failed!')
    .to.eventually.not.be.rejected;

    reporter.progress('Executing "sg test --dry-run"');

    // Execute "sg test --dry-run"
    const child = cd('test').spawn('node', [sgPath, 'test', '--dry-run']);
    let stdoutCache: string = '';

    child.ref.stdout.on('data', chunk => stdoutCache += chunk);

    await expect(child.promise).to.eventually.have.property('code', 0);
    expect(stdoutCache).to.not.include('Building the server');
    expect(stdoutCache).to.not.include('Building tests');

  });

});
