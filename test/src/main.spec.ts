import 'source-map-support/register';
import { spawn } from './lib/child-process';
import { wait } from './lib/wait';
import { kill } from './lib/kill';
import path from 'path';
import fs from 'fs-extra';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import 'mocha-progress-reporter';

// Install plugin
chai.use(chaiAsPromised);

before(async function() {

  // Set globals
  (<any>global).spawn = spawn;
  (<any>global).sgPath = path.resolve(__dirname, '..', '..', 'bin', 'sg.js');
  (<any>global).testDir = path.resolve(__dirname, '..', '..', '.playground');
  (<any>global).wait = wait;
  (<any>global).kill = kill;

  // Ensure empty test directory
  await fs.remove(testDir);
  await fs.ensureDir(testDir);

});

// Import tests
import './new.spec';

after(async function() {

  // Remove test directory
  await fs.remove(testDir);

});
