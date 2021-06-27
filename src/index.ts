import 'dotenv/config';
import 'reflect-metadata';
const express = require('express');

import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './UserResolver';
import { createConnection } from 'typeorm';
import cookieParser from 'cookie-parser';

// Types
import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { JWT } from '../configs';
import { User } from './entity/User';
import { createAccessToken, sendRefreshToken } from './auth';
import cors from 'cors';

(async () => {
    // TODO separate express app from server
    // init express server
    const app: any = express();

    // Middlewares
    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        }),
    );
    app.use(cookieParser());

    // Routes
    app.post('/refresh_token', async (req: Request, res: Response) => {
        const failed = (note = '') => {
            console.log(note);
            return res.send({
                ok: false,
                accessToken: '',
            });
        };

        const token = req.cookies.jid;
        if (!token) {
            return failed('refresh_token: no token');
        }

        // TODO fix any
        // Consider: extract to a util
        let payload: any;
        let userId: number | undefined;
        try {
            payload = verify(token, JWT.refreshSecret);
            userId = payload.userId;
        } catch (err) {
            console.log('refresh_token: err', err);
            return failed(`refresh_token: verify err: ${err.message}`);
        }

        // refresh token is valid
        // OK to send back an accessToken
        const user = await User.findOne({ id: userId });

        if (!user) {
            return failed('refresh_token: no user');
        }

        // tokenVersion is used to revoke all sessions
        // In case of need
        if (user.tokenVersion !== payload.tokenVersion) {
            return failed('refresh_token: invalid tokenVersion');
        }

        // Refresh the refresh token
        // Allows the user to stay connected more than the
        // refresh token expiry date
        sendRefreshToken(res, user);

        return res.send({ ok: true, accessToken: createAccessToken(user) });
    });

    await createConnection().then(() =>
        console.log('(i) DB connection successful'),
    );

    const apolloServer = new ApolloServer({
        // Creates graphql schema
        schema: await buildSchema({
            resolvers: [UserResolver],
        }),
        // Make the {req, res} accessible in the resolvers
        context: ({ req, res }) => ({ req, res }),
    });

    // Exposed graphql on express app
    // url/graphql opens the graphql dashboard
    apolloServer.applyMiddleware({
        app,

        // Handle cors manually
        cors: false,
    });

    app.listen(process.env.PORT, () => {
        console.log('(i) init express server');
    });
})();
