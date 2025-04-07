import { Router } from 'express';
import passport from 'passport';

export const giphyRoute = Router();

/**
 * Route for handling Giphy search requests.
 */
giphyRoute.get(
    '/giphy-search',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        const query = req.query.query as string;
        const limit = req.query.limit || 24;
        const offset = req.query.offset || 0;

        const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
        const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

        if (!query) {
            return res
                .status(400)
                .json({ message: 'Search query is required' });
        }
        if (!GIPHY_API_KEY) {
            console.error(
                'Giphy API Key is missing from server environment variables'
            );
            return res
                .status(500)
                .json({ message: 'Server configuration error' });
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
    }
);

/**
 * Route for handling Giphy trending requests.
 */
giphyRoute.get(
    '/giphy-trending',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        const limit = req.query.limit || 24;
        const offset = req.query.offset || 0;
        const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
        const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

        if (!GIPHY_API_KEY) {
            console.error(
                'Giphy API Key is missing from server environment variables'
            );
            return res
                .status(500)
                .json({ message: 'Server configuration error' });
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
    }
);
