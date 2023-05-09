import { Request, Response } from 'express';

const getTenorKey = (req: Request, res: Response) => {
    const key = process.env.TENOR_API_KEY;
    res.json({ key });
};

export { getTenorKey };
