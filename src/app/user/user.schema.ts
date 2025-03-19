import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../domain/enums/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0 })
  ownedAmount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Loan' }] })
  loans: Types.ObjectId[];
  @Prop({
    type: [
      {
        account_number: { type: String, required: true },
        account_name: { type: String, required: true },
        bank_code: { type: String, required: true },
        bank_name: { type: String, required: true },
        recipient_code: { type: String, required: true },
      },
    ],
    default: [],
    _id: false, // Prevents MongoDB from auto-generating _id for each bank object
  })
  banks: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
    recipient_code: string;
  }[];

  @Prop({ required: true, enum: Role, default: Role.USER })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
