import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Document, Types } from 'mongoose';

export enum LoanStatus {
  PENDING = 'Pending',
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  DISBURSED = 'Disbursed',
  PAID = 'Paid',
  REJECTED = 'Rejected',
}

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  repaymentPeriod: number;

  @Prop({ enum: LoanStatus, default: LoanStatus.PENDING })
  @IsEnum(LoanStatus)
  status: LoanStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  disbursedBy?: Types.ObjectId;

  @Prop({})
  remainingBalance?: number;

  @Prop({ required: false })
  @IsOptional()
  @IsDateString()
  requestDate?: Date;

  @Prop({ required: false })
  @IsOptional()
  @IsDateString()
  reviewedDate?: Date;

  @Prop({ required: false })
  @IsOptional()
  @IsDateString()
  approvalDate?: Date;

  @Prop({ required: false })
  @IsOptional()
  @IsDateString()
  rejectionDate?: Date;

  @Prop({ required: false })
  @IsOptional()
  @IsDateString()
  disbursementDate?: Date;

  @Prop({})
  dueDate?: Date;

  @Prop({ default: 0 })
  @IsNumber()
  amountPaid: number;

  @Prop({ required: true })
  @IsNumber()
  totalAmount: number;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
