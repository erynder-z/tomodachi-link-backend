import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/post';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';

/**
 * Checks if the current user is allowed to perform a read operation on a post owned by another user.
 *
 * @param {UserModelType | null} currentUser - the current user
 * @param {mongoose.Types.ObjectId} postOwnerId - the ID of the owner of the post
 * @return {Promise<boolean>} whether the read operation is forbidden
 */
const isReadOperationForbidden = async (
    currentUser: UserModelType | null,
    postOwnerId: mongoose.Types.ObjectId
): Promise<boolean> => {
    if (!currentUser) {
        return true;
    }
    if (
        currentUser._id.toString() !== postOwnerId.toString() &&
        !currentUser.friends.includes(postOwnerId)
    ) {
        return true;
    }
    return false;
};

/**
 * Counts the number of posts containing an image for a specific user ID.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void>} a promise that resolves with the count of posts containing an image
 */
const countPostsContainingImage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id;
        const count = await Post.countDocuments({
            owner: new mongoose.Types.ObjectId(id),
            image: { $exists: true },
        });
        res.status(200).json({ count });
    } catch (err) {
        return next(err);
    }
};

/**
 * Asynchronous function to retrieve a list of pictures.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<Record<string, any>>>} Promise that resolves with the list of pictures
 */
const getPictureList = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<Record<string, any>>> => {
    const skip = parseInt(req.query.skip as string, 10) || 0;

    try {
        const id = req.params.id;
        const ITEMS_PER_PAGE = 9;
        const ownerId = new mongoose.Types.ObjectId(id);

        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);

        if (await isReadOperationForbidden(currentUser, ownerId)) {
            const ERROR_MESSAGE = 'Forbidden';
            return res.status(403).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const userPosts = await Post.find({
            owner: ownerId,
            image: { $exists: true },
        })
            .select('image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .lean()
            .exec();

        const images = userPosts.map((post) => post.image);
        res.status(200).json({ images });
    } catch (err) {
        return next(err);
    }
};

/**
 * Asynchronously searches for GIFs on Giphy based on the query parameter and sends the results as a JSON response.
 *
 * @param {Request} req - The request object containing query parameters for search.
 * @param {Response} res - The response object used to send back the search results or errors.
 * @return {Promise<void>} A promise that resolves when the search results are sent as JSON response.
 * 
 * - If the search query is missing, responds with a 400 status and error message.
 * - If the Giphy API key is missing, logs an error and responds with a 500 status and error message.
 * - Handles errors from the Giphy API and network issues, and responds with appropriate error messages.
 */

const searchGiphy = async (req: Request, res: Response) => {
    const query = req.query.query as string;
    const limit = req.query.limit || 24;
    const offset = req.query.offset || 0;

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    if (!GIPHY_API_KEY) {
        console.error(
            'Giphy API Key is missing from server environment variables'
        );
        return res.status(500).json({ message: 'Server configuration error' });
    }

    const url = `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
        query
    )}&limit=${limit}&offset=${offset}&rating=g&lang=en`;

    try {
        const giphyResponse = await fetch(url);
        if (!giphyResponse.ok) {
            console.error(
                `Giphy API Error: ${
                    giphyResponse.status
                } ${await giphyResponse.text()}`
            );
            return res
                .status(giphyResponse.status)
                .json({ message: 'Error from Giphy API' });
        }
        const giphyData = await giphyResponse.json();
        res.json(giphyData);
    } catch (error) {
        console.error('Error fetching from Giphy:', error);
        res.status(500).json({ message: 'Failed to fetch GIFs via proxy' });
    }
};

/**
 * Asynchronously fetches trending GIFs from Giphy based on the query parameters and sends the results as a JSON response.
 *
 * @param {Request} req - The request object containing query parameters for pagination.
 * @param {Response} res - The response object used to send back the search results or errors.
 * @return {Promise<void>} A promise that resolves when the search results are sent as JSON response.
 * 
 * - If the Giphy API key is missing, logs an error and responds with a 500 status and error message.
 * - Handles errors from the Giphy API and network issues, and responds with appropriate error messages.
 */
const getGiphyTrending = async (req: Request, res: Response) => {
    const limit = req.query.limit || 24;
    const offset = req.query.offset || 0;
    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

    if (!GIPHY_API_KEY) {
        console.error(
            'Giphy API Key is missing from server environment variables'
        );
        return res.status(500).json({ message: 'Server configuration error' });
    }

    const url = `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;

    try {
        const giphyResponse = await fetch(url);
        if (!giphyResponse.ok) {
            console.error(
                `Giphy API Error: ${
                    giphyResponse.status
                } ${await giphyResponse.text()}`
            );
            return res
                .status(giphyResponse.status)
                .json({ message: 'Error from Giphy API' });
        }
        const giphyData = await giphyResponse.json();
        res.json(giphyData);
    } catch (error) {
        console.error('Error fetching trending GIFs from Giphy:', error);
        res.status(500).json({
            message: 'Failed to fetch trending GIFs via proxy',
        });
    }
};

export {
    countPostsContainingImage,
    getPictureList,
    searchGiphy,
    getGiphyTrending,
};
