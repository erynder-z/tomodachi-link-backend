import { UserModelType } from '../models/user.js';
import mongoose from 'mongoose';

/**
 * Validates the friendship status between the current user and the owner of a post.
 *
 * @param {UserModelType | null} currentUser - The current user
 * @param {mongoose.Types.ObjectId} postOwnerId - The ID of the post owner
 * @return {Promise<boolean>} The validation result
 */
export const validateFriendshipStatus = async (
    currentUser: UserModelType | null,
    postOwnerId: mongoose.Types.ObjectId
): Promise<boolean> => {
    if (
        !currentUser ||
        (currentUser._id.toString() !== postOwnerId.toString() &&
            !currentUser.friends.includes(postOwnerId))
    ) {
        return true;
    }
    return false;
};
