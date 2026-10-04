import { Counter } from "../model/counter.model.js";
import { STORE } from "../config/store.js"

const getNextSequence = async (name) => {
    const counter = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
    return counter.seq;
};

export const getNextOrderNumber = async () => {
    const seq = await getNextSequence("order");
    return `${STORE.orderPrefix}-${String(seq).padStart(STORE.orderNumberPad, "0")}`;
};