if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Calendar = require('telegraf-calendar-telegram');

const bot = new Telegraf(process.env.BOT_TOKEN);
const calendar = new Calendar(bot);

bot.use(session())

calendar.setDateListener((context, date) => {
  context.session.date = date;
  context.reply('Event start time(format - 14:00): ');
});

/* https://stackoverflow.com/a/20123018 */
bot.hears(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, ctx => {
  if(ctx.session.startTime) {
    ctx.session.endTime = `${ctx.message.text}:00`;
    ctx.reply('Enter user name and email(paul pftg@jt.com): ');
  } else {
    ctx.session.startTime = `${ctx.message.text}:00`;
    ctx.reply('Event end time(format - 15:00): ');
  }
});
/* https://stackoverflow.com/a/719543 */
bot.hears(/^[a-zA-Z0-9]+\s[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, ctx => {
  const [name, email] = ctx.message.text.split(' ');
  ctx.session.user = {
    name: name,
    email: email
  };
  ctx.reply(`Your data is {
    Start dateTime: ${ctx.session.date}T${ctx.session.startTime}+02:00,
    End dateTime: ${ctx.session.date}T${ctx.session.endTime}+02:00,
    Participant Name: ${ctx.session.user.name},
    Participant Email: ${ctx.session.user.email}
  `)
});

bot.start(ctx => {
  ctx.reply('Welcome')
});
bot.command('new', context => {
  const today = new Date();
	const minDate = new Date();
	minDate.setMonth(today.getMonth() - 2);
	const maxDate = new Date();
	maxDate.setMonth(today.getMonth() + 2);
	maxDate.setDate(today.getDate());

  context.reply('Select event date', calendar.setMinDate(minDate).setMaxDate(maxDate).getCalendar());
});

bot.startPolling();
