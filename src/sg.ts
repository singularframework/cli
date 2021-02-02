#!/usr/bin/env node
import 'source-map-support';
import app from 'argumental';
import path from 'path';

import './commands/new';

app
// Set version
.version(require(path.resolve(__dirname, '..', 'package.json')).version)
// Parse arguments
.parse(process.argv);
