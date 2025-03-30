'use strict';

const { PrismaClient } = require('@prisma/client');

/** @type {PrismaClient} */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Use same instance in development to avoid too many connections
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = {
  prisma,
}; 