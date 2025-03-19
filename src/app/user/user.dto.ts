import { IsNotEmpty } from 'class-validator';

export class AccountNumberDto {
  @IsNotEmpty()
  account_number: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  bank_code: string;
}
