import { body } from 'express-validator';

export const validateImage = () => {
    return body('image').custom((value, { req }) => {
        if (req.file) {
            const file = req.file;
            if (file.mimetype.startsWith('image/')) {
                const cleanFile = {
                    buffer: file.buffer,
                    mimetype: file.mimetype,
                    size: file.size,
                };
                return cleanFile;
            } else {
                throw new Error('Invalid file type');
            }
        }
        return true;
    });
};
