import { useState, useCallback } from 'react';
import photoValidationService, {
  PhotoValidationResult,
  CameraOptions,
} from '~/services/photoValidationService';

interface UsePhotoValidationReturn {
  isValidating: boolean;
  validationResult: PhotoValidationResult | null;
  error: string | null;
  validatePhoto: (
    photohuntId: string,
    source?: 'camera' | 'library',
    options?: CameraOptions
  ) => Promise<PhotoValidationResult>;
  clearResult: () => void;
  clearError: () => void;
}

export const usePhotoValidation = (): UsePhotoValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PhotoValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validatePhoto = useCallback(
    async (
      photohuntId: string,
      source: 'camera' | 'library' = 'camera',
      options: CameraOptions = {}
    ): Promise<PhotoValidationResult> => {
      try {
        setIsValidating(true);
        setError(null);
        setValidationResult(null);

        const result = await photoValidationService.validatePhoto(photohuntId, source, options);
        setValidationResult(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to validate photo';
        setError(errorMessage);
        throw err;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const clearResult = useCallback(() => {
    setValidationResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isValidating,
    validationResult,
    error,
    validatePhoto,
    clearResult,
    clearError,
  };
};
