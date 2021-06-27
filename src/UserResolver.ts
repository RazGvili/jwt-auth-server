import {
    Arg,
    Mutation,
    Query,
    Resolver,
    ObjectType,
    Field,
    Ctx,
    UseMiddleware,
    Int,
} from 'type-graphql';
import { User } from './entity/User';
import { compare, hash } from 'bcryptjs';
import { Context } from './Context';
import { createAccessToken } from './auth';
import { isAuth } from './middlewares/isAuthenticated';
import { sendRefreshToken } from './auth';
import { getConnection } from 'typeorm';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string;
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hi() {
        return 'hi';
    }

    // Example of UseMiddleware
    @Query(() => String)
    @UseMiddleware(isAuth)
    bye(@Ctx() { authPayload }: Context) {
        return `Testing UseMiddleware - userId: ${
            authPayload ? authPayload.userId : '-'
        }`;
    }

    @Query(() => [User])
    users() {
        return User.find();
    }

    // For testing, this endpoint shouldn't be exposed
    @Mutation(() => Boolean)
    async revokeUserRefreshTokens(@Arg('userId', () => Int) userId: number) {
        getConnection()
            .getRepository(User)
            .increment({ id: userId }, 'tokenVersion', 1);

        return true;
    }

    // Use @Mutation for graphql CRUD
    @Mutation(() => Boolean)
    async register(
        // Arg input: graphql argument
        @Arg('email') email: string,
        @Arg('password') password: string,
    ) {
        try {
            const hashedPassword = await hash(password, 12);

            await User.insert({
                email,
                password: hashedPassword,
            });

            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    @Mutation(() => LoginResponse)
    async login(
        // @Arg input: graphql argument
        @Arg('email') email: string,
        @Arg('password') password: string,

        // @Ctx type-graphql make context accessible
        @Ctx() { res }: Context,
    ): Promise<LoginResponse> {
        try {
            const user = await User.findOne({ where: { email } });

            if (!user) {
                throw new Error('invalid login');
            }

            const valid = await compare(password, user.password);

            if (!valid) {
                throw new Error('invalid password');
            }

            sendRefreshToken(res, user);

            return {
                accessToken: createAccessToken(user),
            };
        } catch (err) {
            console.log(err);
            return {
                accessToken: '',
            };
        }
    }
}
