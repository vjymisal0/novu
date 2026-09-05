import { SmsProviderIdEnum } from '@novu/shared';
import { ChannelTypeEnum, ISendMessageSuccessResponse, ISmsOptions, ISmsProvider } from '@novu/stateless';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { createProviderHttpClient } from '../../../utils/http';
import { WithPassthrough } from '../../../utils/types';

export class ValueFirstSmsProvider extends BaseProvider implements ISmsProvider {
  id = SmsProviderIdEnum.ValueFirst;
  channelType = ChannelTypeEnum.SMS as ChannelTypeEnum.SMS;
  public readonly DEFAULT_BASE_URL = 'https://api.myvfirst.com/psms/servlet/psms.Eservice2';
  public readonly TOKEN_URL = 'https://api.myvfirst.com/psms/api/messages/token?action=generate';
  protected casing = CasingEnum.CAMEL_CASE;
  private readonly httpClient = createProviderHttpClient();

  constructor(
    private config: {
      username?: string;
      password?: string;
      apiToken?: string;
      from?: string;
    }
  ) {
    super();
  }

  async sendMessage(
    options: ISmsOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    const from = options.from || this.config.from;

    const payload = this.transform(bridgeProviderData, {
      username: this.config.username,
      password: this.config.password,
      to: options.to,
      from,
      text: options.content,
    });

    const xmlPayload = `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE MESSAGE SYSTEM "http://127.0.0.1/psms/dtd/messagev12.dtd" >
<MESSAGE VER="1.2">
  <USER USERNAME="${payload.body.username || ''}" PASSWORD="${payload.body.password || ''}"/>
  <SMS UDH="0" CODING="1" TEXT="${escapeXml(payload.body.text || '')}" PROPERTY="0" ID="1">
    <ADDRESS FROM="${payload.body.from || ''}" TO="${payload.body.to || ''}" SEQ="1" TAG="some_tag"/>
  </SMS>
</MESSAGE>`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/xml',
      ...payload.headers,
    };

    if (this.config.apiToken) {
      headers.Authorization = `Bearer ${this.config.apiToken}`;
    }

    const response = await this.httpClient.post(this.DEFAULT_BASE_URL, xmlPayload, {
      headers,
    });

    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const idMatch = responseText.match(/GUID="([^"]+)"/) || responseText.match(/ID="([^"]+)"/);
    const messageId = idMatch ? idMatch[1] : `vf_${Date.now()}`;

    return {
      id: messageId,
      date: new Date().toISOString(),
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
