import Notification from "../models/Notification.js";

// Fetch notifications for the current user's role or specific user ID
export const getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    // Load alerts relevant to this role or direct user
    const notifications = await Notification.find({
      $or: [
        { recipientRole: userRole },
        { recipientUser: userId }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Mark all notifications for the current user/role as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipientRole: userRole },
          { recipientUser: userId }
        ],
        read: false
      },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Create a new notification (dispatched by operators, etc.)
export const createNotification = async (req, res) => {
  try {
    const { recipientRole, text } = req.body;

    if (!recipientRole || !text) {
      return res.status(400).json({ success: false, message: "Recipient role and text are required" });
    }

    const notification = new Notification({
      recipientRole,
      text,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification sent successfully!",
      notification,
    });
  } catch (error) {
    console.error("Create Notification Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
