import { Notification } from '../Models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  User
const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch global notifications + user-specific notifications
    const notifications = await Notification.find({
        $or: [
            { targetType: 'Global' },
            { targetType: 'Private', userId: userId }
        ]
    }).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json(
        new ApiResponse(notifications, "Notifications fetched successfully")
    );
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  User
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(notification, "Notification marked as read")
    );
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  User
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            $or: [
                { targetType: 'Global' }, // Note: Global read status per user would require a different schema, but for simple use we'll just track private ones
                { targetType: 'Private', userId: req.user._id }
            ],
            isRead: false
        },
        { isRead: true }
    );

    return res.status(200).json(
        new ApiResponse({}, "All notifications marked as read")
    );
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead
};
