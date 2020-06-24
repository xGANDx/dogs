import { createId } from "../../../util";

const Mongoose = require("mongoose");

const Schema = new Mongoose.Schema({
    _id: Mongoose.Schema.Types.ObjectId,
    title: String,
    user_id: String,
    status: {
        default: true,
        type: Boolean
    },
    completed: {
        default: false,
        type: Boolean
    },
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

createId(Schema);

export default ({
    db,
    master
}) => {

    return db.model('Todo', Schema);
};