import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAddress extends Document {
    encryptedAddress: string,
    addressId: string,
    userId: string
}

const addressSchema: Schema<IAddress> = new Schema({
    encryptedAddress: String,
    addressId: String,
    userId: String
}, { collection: 'addresses', versionKey: false })

export const Address: Model<IAddress> = mongoose.model<IAddress>("addresses", addressSchema);