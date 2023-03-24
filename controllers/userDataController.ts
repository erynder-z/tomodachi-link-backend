import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { UserModelType } from '../models/user';
import { validateEmail } from './validators/profileUpdateValidators/validateEmail';
import { validateFirstName } from './validators/profileUpdateValidators/validateFirstName';
import { validateLastName } from './validators/profileUpdateValidators/validateLastName';
import { validatePassword } from './validators/profileUpdateValidators/validatePassword';

const getUserData = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        const user = req.user as UserModelType;
        const id = user._id;

        try {
            const user = await User.findOne({ _id: id }, { password: 0 });
            if (!user) {
                return res
                    .status(404)
                    .json({ error: { message: 'User not found' } });
            }
            return res.json({ user });
        } catch (err) {
            return next(err);
        }
    }
};

const updateUserData = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validatePassword(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const reqUser = new User({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                message: 'Failed to update user!',
                errors: errors.array(),
                reqUser,
            });

            return;
        }

        if (req.user) {
            const user = req.user as UserModelType;
            const id = user._id;
            try {
                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                    },
                    { new: true }
                );
                res.status(200).json(updatedUser);
            } catch (err) {
                return next(err);
            }
        }
    },
];

export { getUserData, updateUserData };
