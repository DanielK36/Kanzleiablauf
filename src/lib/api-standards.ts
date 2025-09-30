import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class ApiResponseBuilder {
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message
    });
  }

  static error(message: string, status: number = 500): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status });
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 401 });
  }

  static forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 403 });
  }

  static notFound(message: string = 'Not Found'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 404 });
  }

  static badRequest(message: string = 'Bad Request'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 400 });
  }
}

export class ApiHelpers {
  static async handleRequest<T>(
    handler: () => Promise<T>,
    errorMessage: string = 'Internal Server Error'
  ): Promise<NextResponse<ApiResponse<T>>> {
    try {
      const result = await handler();
      return ApiResponseBuilder.success(result);
    } catch (error: any) {
      console.error('API Error:', error);
      return ApiResponseBuilder.error(errorMessage, 500);
    }
  }

  static validateRequiredFields(data: any, fields: string[]): string | null {
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }
}