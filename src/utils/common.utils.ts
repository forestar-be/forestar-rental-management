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
