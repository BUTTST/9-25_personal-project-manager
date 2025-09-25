import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: '請輸入密碼' },
        { status: 400 }
      );
    }
    
    // 驗證密碼
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '密碼錯誤' },
        { status: 401 }
      );
    }
    
    // 登入成功
    return NextResponse.json(
      { 
        message: '登入成功',
        timestamp: Date.now()
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登入失敗' },
      { status: 500 }
    );
  }
}
