import React, { useRef } from 'react';
import { Box, IconButton, CircularProgress, Typography } from '@mui/material';
import {
  Delete as DeleteIcon,
  AddPhotoAlternate as AddPhotoIcon,
  ArrowBack as ArrowLeftIcon,
  ArrowForward as ArrowRightIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { MachineRentedImage } from '../../utils/types';
import { compressImage } from '../../utils/common.utils';

const MAX_IMAGES = 3;

interface MultiImageUploadProps {
  images: MachineRentedImage[];
  isEditing: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (imageId: number) => Promise<void>;
  onReorder: (order: { imageId: number; position: number }[]) => Promise<void>;
  loading?: boolean;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images,
  isEditing,
  onUpload,
  onDelete,
  onReorder,
  loading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedImages = [...images].sort((a, b) => a.position - b.position);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    try {
      const compressedFiles = await Promise.all(
        filesToUpload.map((file) => compressImage(file)),
      );
      await onUpload(compressedFiles);
    } catch (e) {
      console.error('Error compressing images:', e);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMoveLeft = async (index: number) => {
    if (index <= 0) return;
    const newOrder = sortedImages.map((img, i) => {
      if (i === index - 1) return { imageId: img.id, position: index };
      if (i === index) return { imageId: img.id, position: index - 1 };
      return { imageId: img.id, position: i };
    });
    await onReorder(newOrder);
  };

  const handleMoveRight = async (index: number) => {
    if (index >= sortedImages.length - 1) return;
    const newOrder = sortedImages.map((img, i) => {
      if (i === index) return { imageId: img.id, position: index + 1 };
      if (i === index + 1) return { imageId: img.id, position: index };
      return { imageId: img.id, position: i };
    });
    await onReorder(newOrder);
  };

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap">
        {sortedImages.map((image, index) => (
          <Box
            key={image.id}
            sx={{
              position: 'relative',
              width: 160,
              height: 160,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <img
              src={image.url}
              alt={`Image ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {index === 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  backgroundColor: 'rgba(255, 193, 7, 0.9)',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StarIcon sx={{ fontSize: 18, color: '#fff' }} />
              </Box>
            )}
            {isEditing && (
              <>
                <IconButton
                  size="small"
                  onClick={() => onDelete(image.id)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveLeft(index)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      },
                    }}
                  >
                    <ArrowLeftIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === sortedImages.length - 1}
                    onClick={() => handleMoveRight(index)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      },
                    }}
                  >
                    <ArrowRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>
        ))}
        {isEditing && images.length < MAX_IMAGES && (
          <Box
            sx={{
              width: 160,
              height: 160,
              borderRadius: 1,
              border: '2px dashed',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <AddPhotoIcon color="action" sx={{ fontSize: 32 }} />
                <Typography variant="caption" color="text.secondary" mt={0.5}>
                  Ajouter
                </Typography>
              </>
            )}
          </Box>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>
      {!isEditing && images.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Aucune image
        </Typography>
      )}
    </Box>
  );
};

export default MultiImageUpload;
