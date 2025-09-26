'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ImageCropProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspect?: number;
  circularCrop?: boolean;
  minWidth?: number;
  minHeight?: number;
}

const ImageCrop: React.FC<ImageCropProps> = ({
  src,
  onCropComplete,
  onCancel,
  aspect = 1,
  circularCrop = false,
  minWidth = 150,
  minHeight = 150,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          width,
          height,
        ),
        width,
        height,
      ));
    }
  }, [aspect]);

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    pixelCrop: PixelCrop,
    fileName: string = 'cropped-image.jpg'
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to the desired crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'cropped-profile-image.jpg'
      );
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [completedCrop, getCroppedImg, onCropComplete]);

  const handleReset = useCallback(() => {
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current;
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          width,
          height,
        ),
        width,
        height,
      ));
    }
  }, [aspect]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0032A0] to-[#0053d6] px-6 py-4">
          <h3 className="text-xl font-bold text-white">Crop Profile Picture</h3>
          <p className="text-blue-100 text-sm">Adjust the crop area to frame your photo perfectly</p>
        </div>

        {/* Crop Area */}
        <div className="p-6">
          <div className="max-h-96 overflow-hidden rounded-lg border border-gray-200">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current?.width || 0, imgRef.current?.height || 0))}
              aspect={aspect}
              minWidth={minWidth}
              minHeight={minHeight}
              circularCrop={circularCrop}
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={src}
                style={{ maxHeight: '400px', width: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Drag the corners to resize the crop area, or drag the entire area to reposition it.
              {circularCrop && ' The final image will be circular.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleCropComplete}
              disabled={processing || !completedCrop}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#0032A0] to-[#0053d6] text-white rounded-xl hover:from-[#002080] hover:to-[#0040b6] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Apply Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCrop;