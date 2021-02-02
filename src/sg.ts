#!/usr/bin/env node
import 'source-map-support';
import app from 'argumental';
import path from 'path';

import { SgData } from './common/models';

import './commands/new';
import './commands/generate-service';
import './commands/generate-router';
import './commands/generate-interceptor';
import './commands/generate-plugin';

// Set version globally
app.data<SgData>().version = require(path.resolve(__dirname, '..', 'package.json')).version;

app
// Set version
.version(app.data<SgData>().version)
// Parse arguments
.parse(process.argv);
