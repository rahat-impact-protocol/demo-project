import { FileValidator } from '@nestjs/common';

export class CsvFileValidator extends FileValidator {
  constructor() {
    // You can pass options here if needed
    super({});
  }

  isValid(file: any): boolean {
    if (!file) return false;
    
    // 1. Check extension
    const isCsvExtension = file.originalname?.toLowerCase().endsWith('.csv');
    
    // 2. Check common CSV mimetypes (text/csv or excel-related)
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel'];
    const isCsvMime = allowedMimeTypes.includes(file.mimetype);

    return isCsvExtension || isCsvMime;
  }

  buildErrorMessage(): string {
    return 'Validation failed: File must be a valid .csv file';
  }
}