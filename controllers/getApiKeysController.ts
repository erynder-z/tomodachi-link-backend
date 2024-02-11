import { Request, Response } from 'express';

/**
 * Retrieves the Tenor API key from the environment variables and sends it as a JSON response.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @return {void} JSON response containing the Tenor API key
 */
const getTenorKey = (req: Request, res: Response): void => {
    const key = process.env.TENOR_API_KEY || '';
    res.json({ key });
};

export { getTenorKey };
