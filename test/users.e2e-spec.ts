import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got');

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'test@gmail.com',
  password: '1234',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Owner
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return publicTest(`
          mutation {
            createAccount(input: {
              email: "${testUser.email}",
              password: "1234",
              role: Owner
            }) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input: {
              email: "${testUser.email}",
              password: "${testUser.password}"
            }){
              ok,
              error,
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should not be login with incorrect user', () => {
      return publicTest(`
          mutation {
            login(input: {
              email: "${testUser.email}2",
              password: "${testUser.password}"
            }){
              ok,
              error,
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('User not found');
          expect(login.token).toBe(null);
        });
    });

    it('should not be login with incorrect password', () => {
      return publicTest(`
          mutation {
            login(input: {
              email: "${testUser.email}",
              password: "${testUser.password}!@#$"
            }){
              ok,
              error,
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });

    it(`should see a user's profile`, () => {
      return privateTest(`
        {
          userProfile(userId:${userId}) {
            ok
            error
            user {
              id
              email
            }
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return privateTest(`
          {
            userProfile(userId:100) {
              ok
              error
              user {
                id
                email
              }
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User not found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
          {
            me {
              id
              email
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { id, email },
              },
            },
          } = res;
          expect(id).toEqual(expect.any(Number));
          expect(email).toBe(testUser.email);
        });
    });

    it('shoud not allow logged out user', () => {
      return publicTest(`
          {
            me {
              id
              email
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              errors: [{ message }], // const [message] = res.body.errors
            },
          } = res;
          console.log(res.body);
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new_test@test.com';

    it('should change email', () => {
      return privateTest(`
          mutation {
            editProfile(input: {
              email: "${NEW_EMAIL}"
            }){
              ok,
              error
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('shoud have new email', () => {
      return privateTest(`
          {
            me {
              id
              email
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { id, email },
              },
            },
          } = res;
          expect(id).toEqual(expect.any(Number));
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`
          mutation {
            verifyEmail(input: { code: "${verificationCode}" }) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should fail on verification code not found', () => {
      return publicTest(`
          mutation {
            verifyEmail(input: { code: "xxxxxx" }) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found');
        });
    });
  });
});
