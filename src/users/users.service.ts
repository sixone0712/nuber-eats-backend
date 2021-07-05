import { MailService } from './../mail/mail.service';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from './../jwt/jwt.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async creaetAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] }, // select한 Column만 가져온다.
      );

      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: `Can't log user in`,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      //const user = await this.users.findOne({ id });
      //if (!user) throw Error();
      const user = await this.users.findOneOrFail({ id });
      return {
        user,
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        error: 'User not found',
        ok: false,
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    // can't call BeforeUpDate() hooks
    // async editProfile(userId: number, editProfileInput: EditProfileInput) {
    //return this.users.update(userId, { ...editProfileInput });
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        this.verifications.delete({ user: { id: user.id } });
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) user.password = password;
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Could not update profile.' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verifycation = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
        // load only user.id
        // { loadRelationIds: true }
      );
      if (verifycation) {
        verifycation.user.verified = true;
        await this.users.save(verifycation.user);
        await this.verifications.delete(verifycation.id);
        return { ok: true };
      }
      return { ok: false, error: 'Verification not found' };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Could not verify email' };
    }
  }
}
