import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadsDir = './uploads';

  constructor() {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  getStorageConfig(folder: string) {
    const uploadPath = path.join(this.uploadsDir, folder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return diskStorage({
      destination: uploadPath,
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const name = file.originalname.split('.')[0].replace(/\s+/g, '-');
        callback(null, `${name}-${uniqueSuffix}${ext}`);
      },
    });
  }

  getFieldStorage(baseFolder: string) {
    return diskStorage({
      destination: (req, file, callback) => {
        const subfolder = file.fieldname === 'images' ? 'images' : 'videos';
        const uploadPath = path.join(this.uploadsDir, baseFolder, subfolder);
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const name = file.originalname.split('.')[0].replace(/\s+/g, '-');
        callback(null, `${name}-${uniqueSuffix}${ext}`);
      },
    });
  }

  getFileFilter(allowedExtensions: string[]) {
    return (req, file, callback) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return callback(
          new BadRequestException(`Only ${allowedExtensions.join(', ')} files are allowed`),
          false,
        );
      }
      callback(null, true);
    };
  }

  deleteFile(filePath: string): void {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }

  deleteFiles(filePaths: string[]): void {
    filePaths.forEach((filePath) => this.deleteFile(filePath));
  }

  getFileUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }

  async uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const filePaths: string[] = [];
    
    try {
      for (const file of files) {
        filePaths.push(`${folder}/${file.filename}`);
      }
      return filePaths;
    } catch (error) {
      // Clean up on error
      filePaths.forEach((path) => this.deleteFile(path));
      throw new BadRequestException('File upload failed');
    }
  }
}
