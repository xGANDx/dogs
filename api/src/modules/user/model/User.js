import { createId } from "../../../util";
const Mongoose = require("mongoose");

const Schema = new Mongoose.Schema({
  _id: Mongoose.Schema.Types.ObjectId,
  login: String,
  name: String,
  email: String,
  password: String,
  status: Boolean
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

createId(Schema);

export default ({
  db,
  master
}) => {

  return db.model('User', Schema);
};