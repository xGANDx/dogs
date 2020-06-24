import { ObjectId } from 'mongodb';
import { pubsub } from '../../../app';


const typeDefs = {
    Query: `
        todos: [Todo]
    `,

    Mutation: `
        newTodo(title: String!): Todo
        removeTodo(_id: String!): Todo
        toggleTodo(_id: String!): Todo
        completeAll: [Todo]
        setAllIncomplete: [Todo]
        clearCompleted: [Todo]
    `,
    Subscription: `
        subTodo: ResultSubTodo
    `,
    Type: `
        type Todo {
        _id: ID
        id: String
        title: String
        user_id: String
        user: User
        completed: Boolean
        status: Boolean
        }

        type ResultSubTodo {
            todo: Todo
            type: TypeSubTodo
        }

        enum TypeSubTodo {
            newTodo
            removeTodo
            toggleTodo
            completeAll
            setAllIncomplete
            clearCompleted
          }
          
    `
}

const resolvers = {
    Todo: {
        id: async (parent, args, ctx, info) => {
            return parent._id;
        },
        user: async (parent, args, ctx, info) => {
            try {
                let result = await ctx.models.User.findById(parent.user_id);
                return result;
            } catch (error) {
                console.log(error)
            }
        }
    },
    Query: {
        todos: async (parent, args, ctx, info) => {
            try {
                let result = await ctx.models.Todo.find({
                    status: true
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        }
    },
    Mutation: {
        newTodo: async (parent, args, ctx, info) => {
            try {

                let result = await ctx.models.Todo.create({
                    ...args,
                    user_id: ctx.user_id
                });
                pubsub.publish('SUB_TODO', {
                    type: 'newTodo',
                    todo: result
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        },
        removeTodo: async (parent, args, ctx, info) => {
            try {
                const { _id } = args;
                let result = await ctx.models.Todo.findOneAndUpdate(
                    {
                        _id
                    },
                    {
                        $set: {
                            status: false
                        }
                    },
                    {
                        new: true
                    }
                );
                pubsub.publish('SUB_TODO', {
                    type: 'removeTodo',
                    todo: result
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        },
        toggleTodo: async (parent, args, ctx, info) => {
            try {
                const { _id } = args;
                let todo = await ctx.models.Todo.findOne(
                    {
                        _id
                    }
                );
                todo.completed = !todo.completed;
                let result = await todo.save();
                pubsub.publish('SUB_TODO', {
                    type: 'toggleTodo',
                    todo: result
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        },
        completeAll: async (parent, args, ctx, info) => {
            try {
                await ctx.models.Todo.updateMany(
                    {

                    },
                    {
                        completed: true
                    }
                );
                let result = ctx.models.Todo.find();
                pubsub.publish('SUB_TODO', {
                    type: 'completeAll'
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        },
        setAllIncomplete: async (parent, args, ctx, info) => {
            try {
                await ctx.models.Todo.updateMany(
                    {

                    },
                    {
                        completed: false
                    }
                );
                let result = ctx.models.Todo.find();
                pubsub.publish('SUB_TODO', {
                    type: 'setAllIncomplete'
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        },
        clearCompleted: async (parent, args, ctx, info) => {
            try {
                await ctx.models.Todo.updateMany(
                    {
                        completed: true
                    },
                    {
                        status: false
                    }
                );
                let result = ctx.models.Todo.find();
                pubsub.publish('SUB_TODO', {
                    type: 'clearCompleted'
                });
                return result;
            } catch (error) {
                console.log(error)
            }
        },
    },
    Subscription: {
        subTodo: {
            resolve: async (parent, args, ctx, info) => {
                return parent;
            },
            subscribe: (parent, args, ctx, info) => {
                return pubsub.asyncIterator(['SUB_TODO']);
            }
        }
    }
}

export default {
    resolvers,
    typeDefs
}