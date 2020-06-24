import { MongoClient, ObjectId } from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { model, graphql } from './modules';
import mongoose from 'mongoose';
const { ApolloServer, gql } = require('apollo-server-express');
import moment from 'moment';
var compression = require('compression')
import http from 'http';
import { auth } from './util';
import { AuthenticationError } from 'apollo-server-express';
const { PubSub } = require('graphql-subscriptions');
export const pubsub = new PubSub();
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(compression());

export const main = async () => {
  mongoose.Promise = global.Promise;
  var master = mongoose.createConnection(process.env.ENDPOINT, { useNewUrlParser: true, useUnifiedTopology: true });

  app.use('/upload', express.static('upload'));

  const server = new ApolloServer({
    typeDefs: gql`${graphql.typeDefs}`,
    resolvers: graphql.resolvers,
    subscriptions: {
      onConnect: (connectionParams, webSocket) => {
        console.log('connect ws !');
        return connectionParams
      },
      keepAlive: 10,
    },
    context: async ({ req, res, connection, payload }) => {
      let authorization, operationName;
      if (connection) {
        authorization = payload.authorization ? payload.authorization : connection.context.authorization;
        operationName = connection.operationName;
      } else {
        authorization = req.headers.authorization;
        operationName = req.body.operationName;
      }

      let authResult = await auth({
        authorization,
        operationName
      }).catch(e => {
        if (e == 'abort') {
          throw new AuthenticationError('not auth.');
        }
      });
      authResult = !authResult ? {} : authResult;

      return {
        models: model({
          db: master,
          master: master
        }),
        connection,
        user_id: authResult.user_id,
      }
    }
  });

  server.applyMiddleware({ app });

  //WS
  const httpServer = http.createServer(app)
  server.installSubscriptionHandlers(httpServer)


  httpServer.listen(process.env.PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`
    );
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${process.env.PORT}${server.subscriptionsPath}`
    );
  });
  return app;
}
