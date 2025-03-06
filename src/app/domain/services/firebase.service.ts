import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  constructor(private configService: ConfigService) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async createFirebaseUser(
    email: string,
    password: string,
    phoneNumber?: string,
  ) {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        phoneNumber,
        emailVerified: false,
        disabled: false,
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Firebase User Creation Failed: ${error.message}`);
    }
  }
  async verifyUser(email: string) {
    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);

      return { uid: userRecord.uid };
    } catch (error) {
      throw new UnauthorizedException('No user found with the email');
    }
  }

  async sendOtp(phone: string) {
    if (!/^\+\d{10,15}$/.test(phone)) {
      throw new BadRequestException(
        'Invalid phone number format. Use E.164 format (e.g., +1234567890)',
      );
    }
    // try {
    //   const user = await admin.auth().createCustomToken(phone);
    //   console.log(user);

    //   return `OTP sent to=`;
    // } catch (error) {
    //   throw new Error('Error sending OTP: ' + error.message);
    // }
  }

  async verifyIdToken(otp: string): Promise<any> {
    try {
      const isTokenValid = await admin.auth().verifyIdToken(otp);
      if (!isTokenValid) {
        throw new BadRequestException('Invalid otp code');
      }
      return 'Phone number has been verified';
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
