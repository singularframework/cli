import 'source-map-support/register';
import 'mocha-progress-reporter';

import { spawn, cd } from './lib/child-process';
import { wait } from './lib/wait';
import { kill } from './lib/kill';

import path from 'path';
import fs from 'fs-extra';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

// Install plugin
chai.use(chaiAsPromised);

reporter.config({ logs: false, hooks: true });

before('Test preparation', async function() {

  reporter.log('Setting globals');

  // Set globals
  (<any>global).spawn = spawn;
  (<any>global).cd = cd;
  (<any>global).sgPath = path.resolve(__dirname, '..', '..', 'bin', 'sg.js');
  (<any>global).testDir = path.resolve(__dirname, '..', '..', '.playground');
  (<any>global).wait = wait;
  (<any>global).kill = kill;
  (<any>global).processes = [];

  // Set Singular config profile for all tests
  process.env.SINGULAR_CONFIG_PROFILE = 'dev';

  reporter.log('Ensuring empty test directory');

  // Ensure empty test directory
  await fs.remove(testDir);
  await fs.ensureDir(testDir);

});

// Import tests
import './new.spec';
import './generate.spec';

afterEach('Reporter log reset (turn off)', function() {

  reporter.log('Turning off logs');

  reporter.config({ logs: false });

});

afterEach('Test case cleanup (kill remaining processes)', async function() {

  reporter.log('Killing all remaining processes if left over');

  // Kill all running processes
  for ( let i = 0; i < processes.length; i++ ) {

    await kill(processes[i]);

    // Adjust i (since kill removes the process from the array)
    i--;

  }

});

after('Test cleanup', async function() {

  reporter.log('Removing playground directory');

  // Remove test playground directory
  await fs.remove(testDir);

});
