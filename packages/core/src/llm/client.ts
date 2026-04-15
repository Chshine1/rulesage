import { ChatOpenAI } from '@langchain/openai';

export interface LLMInvokeOptions {
  response_format?: 'json_object' | 'text';
}

export class LLMClient {
  private model: ChatOpenAI;

  constructor() {
    const apiKey = process.env['OPENAI_API_KEY'] || process.env['LLM_API_KEY'];
    const baseURL = process.env['LLM_BASE_URL'] || 'https://api.openai.com/v1';
    const model = process.env['LLM_MODEL'] || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error(
        'LLM_API_KEY or OPENAI_API_KEY environment variable is required',
      );
    }

    this.model = new ChatOpenAI({
      apiKey,
      configuration: { baseURL },
      model,
      temperature: 0.1,
    });
  }

  async invoke(prompt: string, options?: LLMInvokeOptions): Promise<unknown> {
    const response = await this.model.invoke(prompt, {
      ...(options?.response_format === 'json_object'
        ? { response_format: { type: 'json_object' } }
        : {}),
    });
    return JSON.parse(response.content as string);
  }
}
