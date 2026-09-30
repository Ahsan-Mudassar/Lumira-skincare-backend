import { Counter } from "../model/counter.model.js";

const ORDER_PREFIX = "LUM";
const ORDER_PAD_LENGTH = 4;

const getNextSequence = async (name) => {
    const counter = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { returnDocument:'after', upsert: true, setDefaultsOnInsert: true }
    );
    return counter.seq;
};

export const getNextOrderNumber = async () => {
    const seq = await getNextSequence("order");
    return `${ORDER_PREFIX}-${String(seq).padStart(ORDER_PAD_LENGTH, "0")}`;
};