import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDrop extends Document {
    itemName: string;
    itemImages: any[];
    itemStock: any[];
    itemPrice: number;
    itemId: string;
    category: string;
    dropId: string;
    forSale: boolean;
}

const dropSchema = new Schema({
    itemName: String,
    itemImages: Array,
    itemStock: Array,
    itemPrice: Number,
    itemId: String,
    category: String,
    dropId: String,
    forSale: Boolean
}, { collection: 'drops', versionKey: false })

export const Drop: Model<IDrop> = mongoose.model<IDrop>("drops", dropSchema);