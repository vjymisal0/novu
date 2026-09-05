import { ValueFirstSmsProvider } from './valuefirst.provider';

describe('ValueFirstSmsProvider', () => {
  it('should trigger ValueFirst library correctly with username and password', async () => {
    const provider = new ValueFirstSmsProvider({
      username: 'test_user',
      password: 'test_password',
      from: 'TEST_SENDER',
    });

    const spy = jest.spyOn((provider as any).httpClient, 'post').mockImplementation(async () => {
      return {
        data: '<MESSAGEACK><GUID GUID="vf_msg_12345" ID="1" SEQ="1"/></MESSAGEACK>',
        status: 200,
      } as any;
    });

    const response = await provider.sendMessage({
      to: '+919876543210',
      content: 'Your verification code is 123456',
    });

    expect(spy).toHaveBeenCalled();
    const calledBody = spy.mock.calls[0][1] as string;
    expect(calledBody).toContain('USERNAME="test_user"');
    expect(calledBody).toContain('PASSWORD="test_password"');
    expect(calledBody).toContain('FROM="TEST_SENDER"');
    expect(calledBody).toContain('TO="+919876543210"');
    expect(calledBody).toContain('TEXT="Your verification code is 123456"');
    expect(response.id).toBe('vf_msg_12345');
  });

  it('should support Authorization Bearer token when apiToken is configured', async () => {
    const provider = new ValueFirstSmsProvider({
      apiToken: 'jwt_token_123',
      from: 'TEST_SENDER',
    });

    const spy = jest.spyOn((provider as any).httpClient, 'post').mockImplementation(async () => {
      return {
        data: '<MESSAGEACK><GUID GUID="vf_msg_token_999" ID="1" SEQ="1"/></MESSAGEACK>',
        status: 200,
      } as any;
    });

    const response = await provider.sendMessage({
      to: '+919876543210',
      content: 'Test message',
    });

    expect(spy).toHaveBeenCalled();
    const calledHeaders = spy.mock.calls[0][2]?.headers;
    expect(calledHeaders?.Authorization).toBe('Bearer jwt_token_123');
    expect(response.id).toBe('vf_msg_token_999');
  });
});
