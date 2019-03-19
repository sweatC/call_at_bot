const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Calendar = require('telegraf-calendar-telegram');
const AuthorizationButton = require('./AuthorizationButton');
const GoogleAuthorization = require('./GoogleAuthorization');
const CalendarAPI = require('./CalendarAPI');
const MongoClient = require('mongodb').MongoClient;

class Bot {
  constructor() {
    this.bot = new Telegraf(process.env.BOT_TOKEN);
    this.bot.use(session());
    this.calendar = new Calendar(this.bot);
    this.calendarAPI = new CalendarAPI();
    this._setListeners();
    this._setCommands();
  }

  start() {
    MongoClient.connect(process.env.MONGODB_URI).then(client => {
      this.db = client.db('calendar-bot');
      this.auth = new GoogleAuthorization(this.db);
      this.bot.startPolling();
    }).catch(err => {
      console.log(err.stack);
    });
  }

  _setCommands() {
    this.bot.start(ctx => {
      const userId = ctx.from.id;
      this.auth.checkAuth(userId).then(user => {
        if(!user) {
          const url = this.auth.sendAuthUrl();
          ctx.reply('Please authorize to schedule calls', new AuthorizationButton(url).build()).then(() => {
            this.db.collection('clients').insertOne({ userId: userId }).catch(this._handleError);
          });
        } else if(!user.credentials) {
          this.auth.authorize(userId, this.authCode).then(() => {
            this.bot.reply('Successfully authorized! You can start using me now! Type /help for instructions.');
          }).catch(this._handleError);
        } else {
          const oAuth2Client = this.auth.createAuthClient(user.credentials);
          this.calendarAPI.addEvent(oAuth2Client, this._createEventData(ctx)).then(eventDetails => {
            this.bot.reply('Event successfully created!');
          }).catch(this._handleError);
        }
      })
    });

    this.bot.command('new', context => {
      const today = new Date();
      const minDate = new Date();
      minDate.setMonth(today.getMonth() - 2);
      const maxDate = new Date();
      maxDate.setMonth(today.getMonth() + 2);
      maxDate.setDate(today.getDate());

      context.reply('Select event date', this.calendar.setMinDate(minDate).setMaxDate(maxDate).getCalendar());
    });
  }

  _setListeners() {
    this.bot.on('message', ctx => {
      this.authCode = ctx.message.text;
    })
    this.calendar.setDateListener((context, date) => {
      context.session.date = date;
      context.reply('Event start time(format - 14:00): ');
    });

    /* https://stackoverflow.com/a/20123018 */
    this.bot.hears(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, ctx => {
      if(ctx.session.startTime) {
        ctx.session.endTime = `${ctx.message.text}:00`;
        ctx.reply('Enter user name and email(paul pftg@jt.com): ');
      } else {
        ctx.session.startTime = `${ctx.message.text}:00`;
        ctx.reply('Event end time(format - 15:00): ');
      }
    });

    /* https://stackoverflow.com/a/719543 */
    this.bot.hears(/^[a-zA-Z0-9]+\s[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, ctx => {
      const [name, email] = ctx.message.text.split(' ');
      ctx.session.user = {
        name: name,
        email: email
      };
    });
  }

  _handleError() {
    return (err) => {
      console.log(err.stack);
      this.bot.reply('Unexpected error occurred: ' + err.message);
    };
  }

  _createEventData(context) {
    return {
      calendarId: 'primary',
      resource: {
        summary: 'Test call',
        start: {
          dateTime: `${context.date}T${context.startTime}+02:00`,
          timeZone: this.timeZone
        },
        end: {
          dateTime: `${context.date}T${context.endTime}+02:00`,
          timeZone: this.timeZone
        },
        attendees: [
          { email: context.session.user.email }
        ]
      }
    };
  }
}

module.exports = Bot;
