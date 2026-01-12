import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios, { AxiosRequestConfig, Method } from 'axios';

export interface RestApiCallConfig extends RuleNodeConfig {
  url: string; // API URL (supports templates)
  method?: Method; // HTTP method (default: 'GET')
  headers?: Record<string, string>; // HTTP headers
  body?: any; // Request body (for POST/PUT/PATCH)
  bodyFromMessage?: string; // Key to get body from message
  timeout?: number; // Request timeout in ms (default: 5000)
  outputKey?: string; // Key to store response (default: 'apiResponse')
  includeStatus?: boolean; // Include status code in output (default: false)
}

/**
 * REST API Call Node
 * 
 * Makes HTTP requests to external APIs.
 * Supports templating in URL and body.
 * 
 * Config:
 * - url: API endpoint URL (required, supports {{templates}})
 * - method: HTTP method (default: 'GET')
 * - headers: HTTP headers (optional)
 * - body: Static request body (optional)
 * - bodyFromMessage: Key to get body from message (optional)
 * - timeout: Request timeout in ms (default: 5000)
 * - outputKey: Where to store response (default: 'apiResponse')
 * - includeStatus: Include status code (default: false)
 * 
 * Example URL with template:
 * "https://api.example.com/wells/{{wellId}}/status"
 */
export class RestApiCallNode extends RuleNode {
  constructor(config: RestApiCallConfig) {
    super('rest_api_call', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as RestApiCallConfig;
    const outputKey = config.outputKey || 'apiResponse';
    const method = config.method || 'GET';
    const timeout = config.timeout || 5000;

    if (!config.url) {
      this.log(context, 'error', 'URL not configured');
      return null;
    }

    try {
      // Apply templates to URL
      const url = this.applyTemplate(config.url, message.data);

      // Build request config
      const requestConfig: AxiosRequestConfig = {
        method,
        url,
        timeout,
        headers: config.headers || {},
      };

      // Add body if applicable
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (config.bodyFromMessage) {
          requestConfig.data = this.getNestedValue(message.data, config.bodyFromMessage);
        } else if (config.body) {
          // Apply templates to body if it's a string
          if (typeof config.body === 'string') {
            requestConfig.data = this.applyTemplate(config.body, message.data);
          } else {
            requestConfig.data = config.body;
          }
        }
      }

      // Make request
      const response = await axios(requestConfig);

      // Build output
      const output: any = {
        data: response.data,
      };

      if (config.includeStatus) {
        output.status = response.status;
        output.statusText = response.statusText;
        output.headers = response.headers;
      }

      this.log(context, 'info', 'API call successful', {
        url,
        method,
        status: response.status,
      });

      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: output,
        },
      };
    } catch (error: any) {
      const errorDetails = {
        url: config.url,
        method,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      };

      this.log(context, 'error', 'API call failed', errorDetails);
      return null;
    }
  }

  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
