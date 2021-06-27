import { JwtPayload, verify } from 'jsonwebtoken';
import { Context } from 'src/Context';
import { MiddlewareFn } from 'type-graphql';
import { JWT } from '../../configs';

export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
    const secret = JWT.secret;

    // Expect the client to send an authorization header
    // Example: bearer 1234
    const authorization = context.req.headers['authorization'];
    console.log('authorization', authorization);
    if (!authorization) {
        throw new Error('not authenticated');
    }

    try {
        const token = authorization.split(' ')[1];

        // Returns the payload decoded if the signature is valid
        // If not, it will throw the error.
        const authPayload: string | JwtPayload = verify(token, secret);

        // TODO fix any
        // Allows access to authPayload in the resolver
        context.authPayload = authPayload as any;
    } catch (err) {
        console.log('err: ', err.message);
        throw new Error('not authenticated');
    }

    return next();
};
