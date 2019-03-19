class AuthorizationButton {
  constructor(authUrl) {
    this.authUrl = authUrl;
  }

  build() {
    return {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Authorize', url: this.authUrl }]
        ]
      })
    }
  }
}

module.exports = AuthorizationButton;
