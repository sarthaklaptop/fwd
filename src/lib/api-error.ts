import { NextResponse } from 'next/server';

class ApiError extends Error {
  statusCode: number;
  data: null;
  success: false;
  errors: string[];

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: string[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  send() {
    return NextResponse.json(
      {
        success: this.success,
        message: this.message,
        errors: this.errors,
        data: null,
      },
      { status: this.statusCode }
    );
  }
}

export { ApiError };
