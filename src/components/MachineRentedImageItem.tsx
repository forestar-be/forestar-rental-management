import React, { ReactElement, useEffect, useState } from 'react';
import { MachineRentedWithImage } from '../utils/types';
import {
  Box,
  CircularProgress,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';

const MachineRentedImageItem: React.FC<{
  item: MachineRentedWithImage;
  onClick: ((item: MachineRentedWithImage) => void) | null;
  showItemBar?: boolean;
  children?: ReactElement<any, any> | undefined;
}> = ({ children, item, onClick, showItemBar = true }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = item.imageUrl;
    img.onload = () => {
      setImageSrc(item.imageUrl);
      setImageLoading(false);
    };
    img.onerror = () => {
      console.error('Image failed to load', item.imageUrl);
      setImageLoading(false);
    };
  }, [item.imageUrl]);

  return (
    <ImageListItem
      key={item.id}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        minWidth: imageLoading ? 50 : undefined,
        minHeight: imageLoading ? 50 : undefined,
      }}
      onClick={onClick ? () => onClick(item) : undefined}
    >
      {imageLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <CircularProgress size={24} color="inherit" />
        </Box>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={item.name}
          style={{
            display: imageLoading ? 'none' : 'block',
          }}
        />
      )}
      {children}
      {showItemBar && (
        <ImageListItemBar title={item.name} subtitle={undefined} />
      )}
    </ImageListItem>
  );
};

export default MachineRentedImageItem;
