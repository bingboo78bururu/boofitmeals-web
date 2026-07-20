"use client";

// 사진을 서버로 보내기 전에 브라우저에서 미리 리사이즈·재압축한다.
// 휴대폰 카메라 원본(수 MB~수십 MB)이 그대로 올라가면 Vercel 서버리스
// 함수의 요청 본문 제한/실행 시간 제한에 걸리기 쉬워서, 항상 작은 JPEG로
// 바꿔서 보낸다. 실패하면(구형 브라우저 등) 원본 파일을 그대로 반환한다.
export async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}
