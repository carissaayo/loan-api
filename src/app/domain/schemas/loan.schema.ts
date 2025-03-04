import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  repaymentPeriod: number;

  @Prop({
    required: true,
    enum: ['Pending', 'InReview', 'Approved', 'Disbursed', 'Rejected'],
    default: 'Pending',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  disbursedBy?: Types.ObjectId;

  @Prop({ required: true })
  remainingBalance: number;

  @Prop({ required: true })
  dueDate: Date;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
