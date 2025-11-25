const ShopItem = require('../models/ShopItem');
const UserPurchase = require('../models/UserPurchase');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const { sendPurchaseApprovalNotification, sendPurchaseRejectionNotification, sendPushNotification } = require('./pushNotifications');

/**
 * Покупка товару
 */
const purchaseItem = async (userId, itemId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Користувача не знайдено');
    }

    const item = await ShopItem.findById(itemId);
    if (!item) {
      throw new Error('Товар не знайдено');
    }

    if (!item.isActive) {
      throw new Error('Товар недоступний');
    }

    // Перевірити наявність товару
    if (item.stock !== -1 && item.stock <= 0) {
      throw new Error('Товар закінчився');
    }

    // Перевірити достатність монет
    if (user.coins < item.price) {
      throw new Error('Недостатньо монет для покупки');
    }

    // Якщо не потрібне підтвердження, одразу створюємо покупку зі статусом 'completed'
    // Якщо потрібне підтвердження, створюємо зі статусом 'pending'
    const purchaseStatus = item.requiresApproval ? 'pending' : 'completed';
    const transactionStatus = item.requiresApproval ? 'pending' : 'approved';
    
    // Створити покупку
    const purchase = await UserPurchase.create({
      user: userId,
      item: itemId,
      price: item.price,
      status: purchaseStatus,
      completedAt: !item.requiresApproval ? new Date() : null
    });

    // Списання монет
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: -item.price }
    });

    // Логування транзакції
    await CoinTransaction.create({
      user: userId,
      type: 'spent',
      amount: item.price,
      reason: `Покупка товару: ${item.name}`,
      status: transactionStatus,
      approvedAt: !item.requiresApproval ? new Date() : null,
      relatedEntity: {
        type: 'purchase',
        id: purchase._id
      }
    });

    // Зменшити кількість товару (для обох випадків)
    if (item.stock !== -1) {
      await ShopItem.findByIdAndUpdate(itemId, {
        $inc: { stock: -1 }
      });
    }

    // Якщо покупка одразу завершена (не потребує підтвердження), відправити сповіщення
    if (!item.requiresApproval && user.pushToken) {
      try {
        await sendPushNotification(
          user.pushToken,
          '✅ Покупку завершено!',
          `Вашу покупку "${item.name}" успішно завершено. Товар готовий до отримання.`,
          {
            type: 'purchase_completed',
            itemName: item.name,
            purchaseId: purchase._id
          }
        );
      } catch (error) {
        console.error('Error sending purchase completion notification:', error);
        // Не блокуємо процес, якщо сповіщення не відправлено
      }
    }

    return purchase;
  } catch (error) {
    console.error('Purchase item error:', error);
    throw error;
  }
};

/**
 * Підтвердження покупки адміном
 */
const approvePurchase = async (purchaseId, adminId) => {
  try {
    const purchase = await UserPurchase.findById(purchaseId)
      .populate('item')
      .populate('user', 'pushToken firstName lastName');

    if (!purchase) {
      throw new Error('Покупку не знайдено');
    }

    if (purchase.status !== 'pending') {
      throw new Error('Покупка вже оброблена');
    }

    purchase.status = 'approved';
    purchase.approvedBy = adminId;
    purchase.approvedAt = new Date();
    purchase.completedAt = new Date();
    await purchase.save();

    // Оновити статус транзакції
    await CoinTransaction.updateOne(
      {
        'relatedEntity.type': 'purchase',
        'relatedEntity.id': purchaseId
      },
      {
        $set: {
          status: 'approved',
          approvedBy: adminId,
          approvedAt: new Date()
        }
      }
    );

    // Відправити push-нотифікацію користувачу
    if (purchase.user && purchase.user.pushToken) {
      try {
        console.log('Sending purchase approval notification to user:', purchase.user._id, 'with token:', purchase.user.pushToken);
        const notificationResult = await sendPurchaseApprovalNotification(
          purchase.user.pushToken,
          purchase.item.name
        );
        console.log('Purchase approval notification result:', notificationResult);
      } catch (error) {
        console.error('Error sending purchase approval notification:', error);
        // Не блокуємо процес, якщо сповіщення не відправлено
      }
    } else {
      console.log('Purchase approval notification skipped - no push token for user:', purchase.user?._id);
    }

    return purchase;
  } catch (error) {
    console.error('Approve purchase error:', error);
    throw error;
  }
};

/**
 * Відхилення покупки адміном
 */
const rejectPurchase = async (purchaseId, adminId, reason) => {
  try {
    const purchase = await UserPurchase.findById(purchaseId)
      .populate('item')
      .populate('user', 'pushToken firstName lastName');

    if (!purchase) {
      throw new Error('Покупку не знайдено');
    }

    if (purchase.status !== 'pending') {
      throw new Error('Покупка вже оброблена');
    }

    purchase.status = 'rejected';
    purchase.approvedBy = adminId;
    purchase.approvedAt = new Date();
    purchase.rejectionReason = reason || 'Відхилено адміністратором';
    await purchase.save();

    // Повернути монети
    await User.findByIdAndUpdate(purchase.user._id, {
      $inc: { coins: purchase.price }
    });

    // Створити транзакцію повернення
    await CoinTransaction.create({
      user: purchase.user._id,
      type: 'refund',
      amount: purchase.price,
      reason: `Повернення за покупку: ${purchase.item.name}`,
      status: 'approved',
      approvedBy: adminId,
      relatedEntity: {
        type: 'purchase',
        id: purchaseId
      }
    });

    // Повернути товар на склад
    if (purchase.item.stock !== -1) {
      await ShopItem.findByIdAndUpdate(purchase.item._id, {
        $inc: { stock: 1 }
      });
    }

    // Відхилити транзакцію списання
    await CoinTransaction.updateOne(
      {
        'relatedEntity.type': 'purchase',
        'relatedEntity.id': purchaseId
      },
      {
        $set: {
          status: 'rejected',
          approvedBy: adminId
        }
      }
    );

    // Відправити push-нотифікацію користувачу
    if (purchase.user && purchase.user.pushToken) {
      try {
        console.log('Sending purchase rejection notification to user:', purchase.user._id, 'with token:', purchase.user.pushToken);
        const notificationResult = await sendPurchaseRejectionNotification(
          purchase.user.pushToken,
          purchase.item.name,
          purchase.rejectionReason
        );
        console.log('Purchase rejection notification result:', notificationResult);
      } catch (error) {
        console.error('Error sending purchase rejection notification:', error);
        // Не блокуємо процес, якщо сповіщення не відправлено
      }
    } else {
      console.log('Purchase rejection notification skipped - no push token for user:', purchase.user?._id);
    }

    return purchase;
  } catch (error) {
    console.error('Reject purchase error:', error);
    throw error;
  }
};

/**
 * Масове підтвердження покупок
 */
const bulkApprovePurchases = async (purchaseIds, adminId) => {
  try {
    const purchases = await UserPurchase.find({
      _id: { $in: purchaseIds },
      status: 'pending'
    }).populate('item').populate('user');

    const results = {
      approved: [],
      failed: []
    };

    for (const purchase of purchases) {
      try {
        await approvePurchase(purchase._id, adminId);
        results.approved.push(purchase._id);
      } catch (error) {
        results.failed.push({
          id: purchase._id,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Bulk approve purchases error:', error);
    throw error;
  }
};

/**
 * Масове відхилення покупок
 */
const bulkRejectPurchases = async (purchaseIds, adminId, reason) => {
  try {
    const purchases = await UserPurchase.find({
      _id: { $in: purchaseIds },
      status: 'pending'
    }).populate('item').populate('user');

    const results = {
      rejected: [],
      failed: []
    };

    for (const purchase of purchases) {
      try {
        await rejectPurchase(purchase._id, adminId, reason);
        results.rejected.push(purchase._id);
      } catch (error) {
        results.failed.push({
          id: purchase._id,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Bulk reject purchases error:', error);
    throw error;
  }
};

module.exports = {
  purchaseItem,
  approvePurchase,
  rejectPurchase,
  bulkApprovePurchases,
  bulkRejectPurchases
};

