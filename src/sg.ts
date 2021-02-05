#!/usr/bin/env node
import 'source-map-support/register';
import app from 'argumental';
import path from 'path';

import { SgData } from './lib/models';
import { loadSingularJson, versionControl } from './lib/version-control';

import './commands/new';
import './commands/build';
import './commands/serve';
import './commands/generate-service';
import './commands/generate-router';
import './commands/generate-interceptor';
import './commands/generate-plugin';
import './commands/add-assets';
import './commands/remove-assets';
import './commands/test';
import './commands/docs';

// Set version globally on app data
app.data<SgData>().version = require(path.resolve(__dirname, '..', 'package.json')).version;
// Set version on cli
app.version(app.data<SgData>().version)

// Detect and load singular.json if possible
loadSingularJson()
// Version control
.then(() => versionControl())
// Run the app
.then(() => app.parse(process.argv))
.catch(error => {

  console.error(error);
  process.exit(1);

});
