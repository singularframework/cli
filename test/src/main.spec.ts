import 'source-map-support/register';
import 'mocha-progress-reporter';

import { spawn } from './lib/child-process';
import { wait } from './lib/wait';
import { kill } from './lib/kill';

import path from 'path';
import fs from 'fs-extra';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

// Install plugin
chai.use(chaiAsPromised);

reporter.config({ logs: false, hooks: false });

before('Test preparation', async function() {

  reporter.log('Setting globals');

  // Set globals
  (<any>global).spawn = spawn;
  (<any>global).sgPath = path.resolve(__dirname, '..', '..', 'bin', 'sg.js');
  (<any>global).testDir = path.resolve(__dirname, '..', '..', '.playground');
  (<any>global).wait = wait;
  (<any>global).kill = kill;
  (<any>global).processes = [];

  reporter.log('Ensuring empty test directory');

  // Ensure empty test directory
  await fs.remove(testDir);
  await fs.ensureDir(testDir);

});

// Import tests
import './new.spec';

afterEach('Resetting logs (turn off)', function() {

  reporter.config({ logs: false });

});

after('Test cleanup', async function() {

  reporter.log('Removing test directory if left over');

  // Remove test directory
  await fs.remove(testDir);

});
