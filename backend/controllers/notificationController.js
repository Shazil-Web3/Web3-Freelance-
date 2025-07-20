const Notification = require('../models/Notification');

// Create a notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, message } = req.body;
    const notif = await Notification.create({ user: userId, type, message });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List notifications for a user
exports.listNotifications = async (req, res) => {
  try {
    const user = req.user.id;
    const notifs = await Notification.find({ user });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    if (notif.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    notif.read = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 