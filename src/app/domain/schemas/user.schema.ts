import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Loan' }] })
  loans: Types.ObjectId[];

  @Prop({
    required: true,
    enum: ['User', 'RiskAssessor', 'FinanceAdmin'],
    default: 'User',
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
