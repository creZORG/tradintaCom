
'use server';

import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error('Cloudinary environment variables are not set.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const body = await request.json();
  const { paramsToSign } = body;

  try {
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );
    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error signing upload:', error);
    return NextResponse.json(
      { error: 'Failed to sign upload request.' },
      { status: 500 }
    );
  }
}
