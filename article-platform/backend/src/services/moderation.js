const axios = require('axios');

class ModerationService {
  constructor() {
    this.serviceUrl = process.env.MODERATION_SERVICE_URL || 'http://localhost:8000';
  }

  async moderateComment(text, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.serviceUrl}/moderate`,
        {
          text,
          metadata
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        isSpam: response.data.is_spam || false,
        isToxic: response.data.is_toxic || false,
        score: response.data.score || 0,
        reason: response.data.reason || null,
        shouldHide: response.data.is_spam || response.data.is_toxic
      };
    } catch (error) {
      console.error('Moderation service error:', error.message);

      return this.fallbackModeration(text);
    }
  }

  fallbackModeration(text) {
    const spamKeywords = ['buy now', 'click here', 'limited offer', 'viagra', 'casino'];
    const toxicKeywords = ['hate', 'kill', 'stupid'];

    const lowerText = text.toLowerCase();
    const isSpam = spamKeywords.some(keyword => lowerText.includes(keyword));
    const isToxic = toxicKeywords.some(keyword => lowerText.includes(keyword));

    return {
      isSpam,
      isToxic,
      score: (isSpam || isToxic) ? 0.8 : 0.2,
      reason: isSpam ? 'spam_keywords' : (isToxic ? 'toxic_keywords' : null),
      shouldHide: isSpam || isToxic
    };
  }
}

module.exports = new ModerationService();