import { UserModelType } from '../models/user';
import mongoose from 'mongoose';

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
