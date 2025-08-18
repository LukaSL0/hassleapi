import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    status: 'Pending' | 'Active';
    role: 'Member' | 'Admin';
    confirmationToken?: string;
    tokenPasswordReset?: string;
    userId?: string;
    secretKey?: string;
    twoFactorAuth: 'OFF' | 'ON';
    addressSelected?: string;
    nextOrderId?: string;
    cartItems?: any[];
    createdAt?: Date;
}

const userSchema: Schema<IUser> = new Schema({
    name: String,
    email: String,
    password: String,
    status: {
        type: String, 
        enum: ['Pending', 'Active'],
        default: 'Pending'
    },
    role: {
        type: String, 
        enum: ['Member', 'Admin'],
        default: 'Member'
    },
    confirmationToken: String,
    tokenPasswordReset: {
        type: String,
        index: { expires: "24h" }
    },
    userId: String,
    secretKey: String,
    twoFactorAuth: {
        type: String,
        enum: ['OFF', 'ON'],
        default: 'OFF'
    },
    addressSelected: String,
    nextOrderId: String,
    cartItems: Array
}, { collection: 'users', versionKey: false, timestamps: true });

export const User: Model<IUser> = mongoose.model<IUser>("catalogo", userSchema);