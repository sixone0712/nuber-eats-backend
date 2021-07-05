import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { Test } from '@nestjs/testing';
import { MailService } from 'src/mail/mail.service';
import got from 'got';
import * as FormData from 'form-data';
import { ExternalExceptionFilterContext } from '@nestjs/core/exceptions/external-exception-filter-context';

const TEST_DOMAIN = 'test_domain';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'test_api_key',
            domain: TEST_DOMAIN,
            fromEmail: 'test@test.com',
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', async () => {
      const sendVerificationEmailArgs = {
        email: 'test@test.com',
        code: 'test_code',
      };
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);

      const result = service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );

      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'email',
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });

  describe('sendEmail', () => {
    it('should send email', async () => {
      // class를 spyOn할려면 prototype을 사용
      const formSpy = jest.spyOn(FormData.prototype, 'append');

      const result = await service.sendEmail('', '', [
        { key: 'attr', value: 'attrValue' },
      ]);

      expect(formSpy).toHaveBeenCalled();
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );

      expect(result).toBeTruthy();
    });

    it('should fail on exception', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const ok = await service.sendEmail('', '', []);
      expect(ok).toEqual(false);
    });
  });
});
