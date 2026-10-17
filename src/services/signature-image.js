export const SIGNATURE_WIDTH = 600;
export const SIGNATURE_HEIGHT = 170;
export const MAX_SIGNATURE_FILE_BYTES = 5 * 1024 * 1024;

export function signatureImageType(bytes) {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  const text = String.fromCharCode(...bytes.slice(0, 12));
  if (text.startsWith('RIFF') && text.slice(8) === 'WEBP') return 'image/webp';
  throw new Error('PNG, JPG 또는 WEBP 서명 이미지를 선택해 주세요.');
}

export function signatureImageRect(width, height) {
  if (!(width > 0 && height > 0) || width * height > 16_000_000 || Math.max(width, height) > 12000) {
    throw new Error('서명 이미지가 너무 큽니다. 1,600만 화소 이하 이미지를 선택해 주세요.');
  }
  const scale = Math.min((SIGNATURE_WIDTH - 16) / width, (SIGNATURE_HEIGHT - 16) / height);
  return { x: (SIGNATURE_WIDTH - width * scale) / 2, y: (SIGNATURE_HEIGHT - height * scale) / 2,
    width: width * scale, height: height * scale };
}

export function hasSignatureInk(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] > 12 && Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 245) return true;
  }
  return false;
}

export async function normalizeSignatureImage(file) {
  if (!file.size) throw new Error('비어 있는 파일입니다. 서명 이미지를 선택해 주세요.');
  if (file.size > MAX_SIGNATURE_FILE_BYTES) throw new Error('서명 이미지는 5MB까지 업로드할 수 있습니다.');
  const type = signatureImageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  const url = URL.createObjectURL(new Blob([file], { type }));
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다. 다른 서명 파일을 선택해 주세요.'));
      img.src = url;
    });
    const rect = signatureImageRect(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = SIGNATURE_WIDTH; canvas.height = SIGNATURE_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('이 브라우저에서 서명 이미지를 처리할 수 없습니다.');
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    if (!hasSignatureInk(context.getImageData(0, 0, canvas.width, canvas.height).data)) {
      throw new Error('서명이 보이지 않는 이미지입니다. 서명이 있는 파일을 선택해 주세요.');
    }
    const result = canvas.toDataURL('image/png');
    if (result.length > 290_000) throw new Error('서명 이미지가 복잡합니다. 서명 부분만 잘라 다시 선택해 주세요.');
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
