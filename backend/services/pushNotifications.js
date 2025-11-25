const https = require('https');

/**
 * Відправка push-нотифікації через Expo Push Notification API
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    if (!pushToken) {
      console.log('Push token not provided, skipping notification');
      return { success: false, message: 'Push token not provided' };
    }

    console.log('Sending push notification:', { title, body, pushToken: pushToken.substring(0, 20) + '...' });

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default'
    };

    const options = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            console.log('Expo Push API response:', JSON.stringify(result, null, 2));
            
            if (result.data && Array.isArray(result.data)) {
              const firstResult = result.data[0];
              if (firstResult && firstResult.status === 'ok') {
                console.log('Push notification sent successfully');
                resolve({ success: true, result });
              } else {
                console.error('Push notification failed:', firstResult);
                resolve({ success: false, result: firstResult });
              }
            } else if (result.data && result.data.status === 'ok') {
              console.log('Push notification sent successfully');
              resolve({ success: true, result });
            } else {
              console.error('Push notification failed:', result);
              resolve({ success: false, result });
            }
          } catch (error) {
            console.error('Error parsing push notification response:', error);
            console.error('Response data:', responseData);
            resolve({ success: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error sending push notification:', error);
        reject({ success: false, error: error.message });
      });

      req.write(JSON.stringify(message));
      req.end();
    });
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Відправка сповіщення про підтвердження покупки
 */
const sendPurchaseApprovalNotification = async (pushToken, itemName) => {
  return await sendPushNotification(
    pushToken,
    '✅ Покупку підтверджено!',
    `Вашу покупку "${itemName}" підтверджено. Товар готовий до отримання.`,
    {
      type: 'purchase_approved',
      itemName
    }
  );
};

/**
 * Відправка сповіщення про відхилення покупки
 */
const sendPurchaseRejectionNotification = async (pushToken, itemName, reason) => {
  return await sendPushNotification(
    pushToken,
    '❌ Покупку відхилено',
    `Вашу покупку "${itemName}" відхилено.${reason ? ` Причина: ${reason}` : ''} Монети повернуто на рахунок.`,
    {
      type: 'purchase_rejected',
      itemName,
      reason
    }
  );
};

/**
 * Відправка сповіщення про підтвердження транзакції
 */
const sendTransactionApprovalNotification = async (pushToken, amount, reason) => {
  return await sendPushNotification(
    pushToken,
    '✅ Транзакцію підтверджено',
    `Транзакцію на суму ${amount} монет підтверджено.${reason ? ` ${reason}` : ''}`,
    {
      type: 'transaction_approved',
      amount,
      reason
    }
  );
};

module.exports = {
  sendPushNotification,
  sendPurchaseApprovalNotification,
  sendPurchaseRejectionNotification,
  sendTransactionApprovalNotification
};

