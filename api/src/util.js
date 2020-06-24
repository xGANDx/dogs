import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import moment from 'moment';
var AWS = require('aws-sdk');

//FUNÇÃO PARA ATRIBUIR VALOR AO _ID
export function createId() {
    for (const item of arguments) {
        item.pre('save', function (next) {
            if (!this._id) this._id = new ObjectId();
            if (!this.id) {
                this.id = new ObjectId()
            };
            next();
        });
    }
}

//FUNÇÃO PARA AUTENTICAR AS REQUISIÇÕES DA API
export function auth({ authorization, operationName }) {
    return new Promise((resolve, reject) => {
        if (['login', 'forgotPassword', 'usersById'].includes(operationName)) {
            return resolve({});
        }
        if (!authorization) return reject('abort');
        jwt.verify(authorization, 'gandfoda', function (err, decoded) {
            if (err) return reject('abort');
            return resolve(decoded);
        });
    });
}

export function sendEmail({
    to = '',
    html = '',
    subject = '',
    attachments = []
}) {
    // if (process.env.NODE_ENV == 'production') {

    // } else {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'made2careEmail@gmail.com',
            pass: 'made2care753951'
        }
    });

    return new Promise((resolve, reject) => {
        try {
            transporter.sendMail(Object.assign({ from: 'made2careEmail@gmail.com' }, {
                to,
                html,
                subject,
                attachments
            }), function (err, info) {
                if (err) {
                    reject('Error in transporter.');
                } else {
                    resolve(true);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

const normalizeNameS3Upload = (filename) => {
    const date = moment();
    let year = date.format('YYYY'),
      month = date.format('MM'),
      day = date.format('DD'),
      hour = date.format('HH'),
      minute = date.format('mm'),
      second = date.format('ss');
    return `${year}_${month}_${day}_${hour}_${minute}_${second}_${filename}`;
  }

//Função para fazer upload de arquivo para S3
export async function uploadS3({
    bucket,
    key,
    body = false,
    file
}) {
    return new Promise(async (resolve, reject) => {

        AWS.config = new AWS.Config();
        AWS.config.accessKeyId = "AKIAJ4IMKVSYSN6R5DDQ";
        AWS.config.secretAccessKey = "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";
        AWS.config.region = "sa-east-1";
        const s3 = new AWS.S3();


        // // Call S3 to list the buckets
        // s3.listBuckets(function (err, data) {
        //     if (err) {
        //         console.log("Error", err);
        //     } else {
        //         console.log("Success 1", data.Buckets);
        //     }
        // });

        // // Create the parameters for calling createBucket
        // var bucketParams = {
        //     Bucket: process.argv[2],
        //     ACL: 'public-read'
        // };

        // // call S3 to create the bucket
        // s3.createBucket(bucketParams, function (err, data) {
        //     if (err) {
        //         console.log("Error", err);
        //     } else {
        //         console.log("Success 2", data.Location);
        //     }
        // });
        let bodyData = body;//QUANDO MANDA VIA BUFFER NAO PRECISA DO createReadStream
        if (!body) {
            const { createReadStream } = await file;
            const stream = await createReadStream();
            bodyData = stream;
        }

        s3.upload({
            Bucket: bucket,
            Key: normalizeNameS3Upload(key),
            Body: bodyData,
            ACL: 'public-read'
        }, function (err, data) {
            if (err) {
                reject();
                console.log(err);
            } else {
                resolve(data);
            }
        });
    })

}

//FUNÇÃO PARA TRATAR OBJETO E RETORNAR O $SET COMO DEVE SER
export function normalize$Set(params) {
    let result = {};

    Object.keys(params).map(key => {
        if (params[key] != null) {
            result[key] = params[key];
        }
    });

    return result;
}