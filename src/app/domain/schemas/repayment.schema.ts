import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RepaymentDocument = Repayment & Document;

@Schema({ timestamps: true })
export class Repayment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Loan' })
  loan: Types.ObjectId;

  @Prop({ required: true })
  amountPaid: number;

  @Prop({ required: true })
  paymentDate: Date;

  @Prop({ required: true })
  remainingBalance: number;
}

export const RepaymentSchema = SchemaFactory.createForClass(Repayment);
