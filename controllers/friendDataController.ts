import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';
import User from '../models/user';

/**
 * Retrieves friend data for the current user and sends it as a JSON response.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void| Response<Record<string, any>>>} sends a JSON response with friend data or passes an error to the error handling middleware
 */
const getFriendData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<Record<string, any>>> => {
    const reqUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(reqUser._id);
        if (!currentUser) {
            const ERROR_MESSAGE = 'Something went wrong retrieving user data!';
            return res.status(404).json({
                errors: [
                    {
                        message: ERROR_MESSAGE,
                    },
                ],
            });
        }

        const friendDataList = await User.aggregate([
            {
                $match: {
                    _id: {
                        $in: currentUser.friends,
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    joined: 1,
                    lastSeen: 1,
                    userpic: 1,
                    accountType: 1,
                },
            },
        ]);

        return res.status(200).json({ friendDataList });
    } catch (err) {
        return next(err);
    }
};

export { getFriendData };
