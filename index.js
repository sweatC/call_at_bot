if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Calendar = require('telegraf-calendar-telegram');

const bot = new Telegraf(process.env.BOT_TOKEN);
const calendar = new Calendar(bot);

bot.use(session())

calendar.setDateListener((context, date) => context.session.date = date);

bot.command('new', context => {
  const today = new Date();
	const minDate = new Date();
	minDate.setMonth(today.getMonth() - 2);
	const maxDate = new Date();
	maxDate.setMonth(today.getMonth() + 2);
	maxDate.setDate(today.getDate());

	context.reply('New Event', calendar.setMinDate(minDate).setMaxDate(maxDate).getCalendar())
});

bot.startPolling();
