const fs = require('fs');
const axios = require('axios');
const path = require('path');
const zlib = require('zlib');
const stream = require('stream');
const { promisify } = require('util');
const { parse } = require('csv-parse');