import { ObjectId } from 'mongodb';
import { AuthenticationError } from 'apollo-server-express';
import jwt from 'jsonwebtoken';

const typeDefs = {
    Query: `
        user(_id:String): User
        me: User
        searchUser(page: Int, skip: Int, search: String, status: Boolean): ResultSearchUser
        simpleSearchUser(name: String): [User]
    `,

    Mutation: `
        saveUser(input: JSON): User
        login(login: String, password: String): ResultLogin
        inactivateUser(_id:[String]): Boolean
        removeUser(_id: String): User
    `,
    Type: `
    type ResultSearchUser{
        total: Int
        result: [User]
    }

    type ResultLogin {
        token: String,
        temporaryPassword: Boolean,
        u: String
        me: User
    }

    type User{
        _id: ID
        login: String
        name: String
        email: String
        password: String
        status: String
    }
    `
}

const resolvers = {
    Query: {
        me: async (parent, args, ctx, info) => {
            try {
                return await ctx.models.User.findById(ctx.user_id);
            } catch (error) {
                console.log(error)
            }
        },
        user: async (parent, args, ctx, info) => {
            try {
                return await ctx.models.User.findById(args._id);
            } catch (error) {
                console.log(error)
            }
        },
        searchUser: async (parent, args, ctx, info) => {
            try {
                const { page, skip, search = "", status = true } = args;

                return {
                    result: ctx.models.User.find({
                        $or: [
                            ...search.split(' ').map(item => (
                                { name: new RegExp(item, 'i') }
                            )),
                            ...search.split(' ').map(item => (
                                { login: new RegExp(item, 'i') }
                            ))
                        ],
                        status: status
                    }).skip((page - 1) * skip).limit(skip).sort({
                        name: 'asc'
                    }),
                    total: ctx.models.User.find({
                        $or: [
                            ...search.split(' ').map(item => (
                                { name: new RegExp(item, 'i') }
                            )),
                            ...search.split(' ').map(item => (
                                { login: new RegExp(item, 'i') }
                            ))
                        ],
                        status: status
                    }).countDocuments()
                };
            } catch (error) {
                console.log(error)
            }
        },
        simpleSearchUser: async (parent, args, ctx, info) => {
            try {
                return ctx.models.User.find({
                    name: {
                        $regex: '.*' + args.name + '.*'
                    },
                    status: true
                });
            } catch (error) {
                console.log(error)
            }
        },
    },
    Mutation: {
        removeUser: async (parent, args, ctx) => {
            const { _id } = args;
            return ctx.models.User.findOneAndUpdate(
                { _id: ObjectId(_id) },
                {
                    $set: {
                        status: false
                    }
                },
                {
                    new: true
                }
            );
        },
        saveUser: async (parent, args, ctx, info) => {
            const { _id, login, email, name, password, status } = args.input;

            if (_id) {
                // edicao
                let User = await ctx.models.User.findOneAndUpdate(
                    { _id: ObjectId(_id) },
                    {
                        login,
                        name,
                        email,
                        password,
                        status
                    },
                    {
                        new: true
                    }
                );
                return User;
            } else {
                let User = await ctx.models.User.create(
                    {
                        login,
                        name,
                        email,
                        password,
                        status: true
                    }
                );
                return User;
            }
        },
        login: async (parent, args, ctx, info) => {
            const { login, password } = args;
            let user = await ctx.models.User.findOne({
                $or: [
                    {
                        'login': login,
                        'password': password
                    },
                    {
                        'email': login,
                        'password': password
                    }
                ],
            });
            if (user) {
                const token = jwt.sign({
                    user_id: user._id,
                }, 'gandfoda', { expiresIn: 24 * 10 * 50 });
                return {
                    token,
                    temporaryPassword: user.temporaryPassword,
                    u: user._id,
                    me: user
                }
            } else {
                throw new AuthenticationError('Erro ao logar.');
            }
        },
        inactivateUser: async (parent, args, ctx, info) => {
            const { _id } = args;
            if (_id) {
                await ctx.models.User.updateMany({
                    _id: _id
                }, {
                    status: false
                });
                return true;
            } else {
                return false;
            }
        }
    }

}

export default {
    resolvers,
    typeDefs
}
