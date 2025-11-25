const AuditLog = require('../models/AuditLog');

/**
 * Middleware для логування дій адміністраторів
 * @param {String} action - Тип дії (create, update, delete, etc.)
 * @param {String} entity - Тип сутності (user, question, etc.)
 * @param {Function} getDescription - Функція для отримання опису дії
 * @param {Function} getChanges - Функція для отримання змін (опціонально)
 */
const auditLog = (action, entity, getDescription, getChanges = null) => {
  return async (req, res, next) => {
    // Логуємо тільки для адмінів
    if (req.user && req.user.role === 'admin') {
      try {
        const description = typeof getDescription === 'function' 
          ? getDescription(req) 
          : getDescription;

        const changes = getChanges && typeof getChanges === 'function'
          ? getChanges(req)
          : null;

        const entityId = req.params.id || req.body.id || req.body.userId || null;

        await AuditLog.create({
          user: req.user._id,
          action,
          entity,
          entityId,
          description,
          changes,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent')
        });
      } catch (error) {
        // Не блокуємо запит, якщо логування не вдалося
        console.error('Audit log error:', error);
      }
    }
    next();
  };
};

/**
 * Функція для логування після виконання дії
 */
const logAction = async (req, action, entity, description, changes = null, entityId = null) => {
  if (req.user && req.user.role === 'admin') {
    try {
      await AuditLog.create({
        user: req.user._id,
        action,
        entity,
        entityId,
        description,
        changes,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }
};

module.exports = { auditLog, logAction };

