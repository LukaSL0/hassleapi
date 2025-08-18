import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITransaction extends Document {
    items: any[];
    price: number;
    status: 'Pending' | 'Preparing' | 'Completed' | 'Cancelled' | 'Requested';
    encryptedAddress: string;
    trackingCode?: string;
    transactionId?: string;
    userEmail?: string;
    userId?: string;
}

const transactionSchema: Schema<ITransaction> = new Schema({
    items: Array,
    price: Number,
    status: {
        type: String, 
        enum: ['Pending', 'Preparing', 'Completed', 'Cancelled', 'Requested'],
        default: 'Pending'
    },
    encryptedAddress: String,
    trackingCode: String,
    transactionId: String,
    userEmail: String,
    userId: String
}, { collection: 'transactions', versionKey: false, timestamps: true });

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>("transactions", transactionSchema);