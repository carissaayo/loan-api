import { IsDateString, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { LoanStatus } from '../schemas/loan.schema';

export class CreateLoanDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  repaymentPeriod: number;

  @IsNotEmpty()
  account_number: number;
}
export class ReviewLoanDto {
  @IsEnum(LoanStatus)
  status: LoanStatus;
}

export class ApproveLoanDto {
  @IsEnum(LoanStatus)
  status: LoanStatus;
}

export class DisburseLoanDto {
  @IsDateString()
  disbursementDate: Date;
}

export class RepaymentDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
