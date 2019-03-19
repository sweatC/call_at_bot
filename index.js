if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const Bot = require('./Bot');
const bot = new Bot();

bot.start();
