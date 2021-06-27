import { JWT } from '../configs';
import { sign } from 'jsonwebtoken';
import { User } from './entity/User';
import { Response } from 'express';

const cookieTypes = {
    JID: 'jid',
};

export const createAccessToken = (user: User) => {
    const payload = {
        userId: user.id,
    };

    return sign(payload, JWT.secret, JWT.options);
};

export const createRefreshToken = (user: User) => {
    const payload = {
        userId: user.id,
        tokenVersion: user.tokenVersion,
    };

    return sign(payload, JWT.refreshSecret, JWT.refreshOptions);
};

/**
 * Adds to express res object the refresh token cookie
 * @param res
 * @param token
 */
export const sendRefreshToken = (res: Response, user: User) => {
    const refreshToken = createRefreshToken(user);
    res.cookie(cookieTypes.JID, refreshToken, { httpOnly: true });
};
