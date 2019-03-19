const GoogleAuth = require('google-auth-library');
const fs = require('fs');
const auth = new GoogleAuth();

class GoogleAuthorization {
  constructor(db) {
    this.db = db;
    let credentials;
    try {
      credentials = JSON.parse(fs.readFileSync(process.env.CLIENT_CREDENTIALS_FILE));
    } catch(e) {
      throw new Error('Unable to load credentials file');
    }
    this.appCredentials = {
      id: credentials.installed.client_id,
      secret: credentials.installed.client_secret,
      redirectUrl: credentials.installed.redirect_uris[0]
    };
    this.timeZone = 'Europe/Kiev';
  }

  checkAuth(userId) {
    return this.db.collection('clients').findOne({ userId: userId });
  }

  sendAuthUrl() {
    const oAuth2Client = this.createAuthClient();
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar'
    });
  }

  authorize(userId, authCode) {
    return new Promise((resolve, reject) => {
      const oAuth2Client = this.createAuthClient();
      oAuth2Client.getToken(authCode, (err, credentials) => {
        if (err) {
          return reject(new Error('Error trying to retrieve access token: ' + err.message));
        }
        return this.db.collection('clients').updateOne({ userId: userId }, { $set: { credentials: credentials } });
      });
    });
  }

  createAuthClient(credentials) {
    const oAuth2Client = new auth.OAuth2(this.appCredentials.id, this.appCredentials.secret, this.appCredentials.redirectUrl);
    if (credentials) {
      oAuth2Client.setCredentials(credentials);
    }
    return oAuth2Client;
  }
}

module.exports = GoogleAuthorization;
