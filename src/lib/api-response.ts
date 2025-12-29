import { NextResponse } from 'next/server';

class ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;

  constructor(
    statusCode: number,
    data: T,
    message: string = 'Success'
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  send() {
    return NextResponse.json(
      {
        success: this.success,
        message: this.message,
        data: this.data,
      },
      { status: this.statusCode }
    );
  }
}

export { ApiResponse };
