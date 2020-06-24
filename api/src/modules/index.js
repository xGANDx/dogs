import merge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import moment from 'moment';
const { createWriteStream } = require("fs");

const storeUpload = ({ stream, filename }) => {
    return new Promise((resolve, reject) => {
        stream
            .pipe(createWriteStream('upload/' + filename))
            .on("finish", () => resolve(true))
            .on("error", (e) => {
                reject(e);
            })
    }
    );
}


let resolvers = {
    JSON: GraphQLJSON,
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(moment(value).format('MM/DD/YYYY')); // value from the client
        },
        serialize(value) {
            return value.toString(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return new Date(ast.value) // ast value is always in string format
            }
            return null;
        },
    }),
    Mutation: {
        uploadFile: async (parent, { file }) => {
            const { createReadStream, filename, mimetype, encoding } = await file;
            await storeUpload({ stream: createReadStream(), filename }).then(r => console.log(r)).catch(e => console.log(e));
            return { filename, mimetype, encoding };
        }
    }
}, querys = '', mutations = '', types = '', subscriptions = '';

function indexGraphql(dirname) {
    require("fs").readdirSync(require("path").join(dirname)).forEach(function (file) {
        if (file !== 'index.js' && file.indexOf('.') >= 0 && dirname.includes('/graphql')) {
            let classe = require(dirname + '/' + file).default;
            const { typeDefs, resolvers: resolverClasse } = classe;

            //VALIDA OS TYPEDEF
            if (typeDefs.Query) querys += typeDefs.Query + '\n';
            if (typeDefs.Mutation) mutations += typeDefs.Mutation + '\n';
            if (typeDefs.Type) types += typeDefs.Type + '\n';
            if (typeDefs.Subscription) subscriptions += typeDefs.Subscription + '\n';

            //VALIDA SE EXISTE RESOLVER
            if (resolverClasse)
                resolvers = merge(resolvers, resolverClasse);
        } else if (file.indexOf('.') < 0) {
            indexGraphql(dirname + '/' + file);
        }
    });
}
indexGraphql(__dirname);

export const graphql = {
    typeDefs: `
      scalar JSON
      scalar Date
  
      type Query {
        ${querys}
      }
  
      type File {
        filename: String!
        mimetype: String!
        encoding: String!
      }
  
      type Mutation {
        uploadFile(file: Upload!) : File!
        ${mutations}
      }
  
  
      type Subscription {
        ${subscriptions}
      }
  
      ${types}
      
      schema {
        query: Query
        mutation: Mutation
        subscription: Subscription
      }  
    `,
    resolvers
};




let models = {};
function indexModel({
    dirname,
    db,
    master
}) {
    require("fs").readdirSync(require("path").join(dirname)).forEach(function (file) {
        if (file !== 'index.js' && file.indexOf('.') >= 0 && dirname.includes('/model')) {
            let model = require(dirname + '/' + file).default;
            models[file.split('.')[0]] = model({
                db,
                master
            });
        } else if (!['commons'].includes(file) && file.indexOf('.') < 0) {
            indexModel({
                dirname: dirname + '/' + file,
                db,
                master
            });
        }
    });
}

export const model = ({
    db,
    master
}) => {
    indexModel({
        dirname: __dirname,
        db,
        master
    });

    return models;
};