import imageCompression from 'browser-image-compression';

export const getKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as Array<keyof T>;

// max size input image in MB
const maxSizeMB = 0.05;
const maxWidthOrHeight = 1024;

export async function compressImage(file: File) {
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  const compressedFile = await imageCompression(file, options);
  const compressedBlob = new Blob([compressedFile], {
    type: 'image/webp',
  });
  return new File([compressedBlob], `${file.name}.webp`, {
    type: 'image/webp',
  });
}

export const formatPriceNumberToFrenchFormatStr = (number: number) => {
  return number.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
};

export const isDifferent = (obj1: any, obj2: any): boolean => {
  if (typeof obj1 !== typeof obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
    return String(obj1) !== String(obj2);
  }
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return true;
    for (let i = 0; i < obj1.length; i++) {
      if (isDifferent(obj1[i], obj2[i])) return true;
    }
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return true;
  for (const key of keys1) {
    if (isDifferent(obj1[key], obj2[key])) return true;
  }
  return false;
};
