'use strict';

const google = require('googleapis');
class CalendarAPI {
  addEvent(data) {
    return new Promise((resolve, reject) => {
      const calendar = google.calendar('v3');
      calendar.events.insert(data, (err, response) => {
        if (err) {
          return reject(new Error('The API returned an error: ' + err));
        }
        resolve(response);
      });
    });
  }
}

module.exports = CalendarAPI;
