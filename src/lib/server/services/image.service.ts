import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { building, dev } from '$app/environment';

// In development, use static/uploads. In production, use build/client/uploads
const UPLOAD_DIR = dev ? 'static/uploads' : 'build/client/uploads';
const SIZES = {
	thumbnail: { width: 150, height: 150 },
	medium: { width: 600, height: 600 },
	large: { width: 1200, height: 1200 }
};

export interface ProcessedImages {
	originalPath: string;
	largePath: string;
	mediumPath: string;
	thumbnailPath: string;
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
	try {
		await fs.access(dirPath);
	} catch {
		await fs.mkdir(dirPath, { recursive: true });
	}
}

export async function processAndSaveImage(file: File): Promise<ProcessedImages> {
	const fileId = uuidv4();
	const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
	const baseFilename = `${fileId}`;

	// Ensure upload directories exist
	await ensureDirectoryExists(path.join(UPLOAD_DIR, 'original'));
	await ensureDirectoryExists(path.join(UPLOAD_DIR, 'large'));
	await ensureDirectoryExists(path.join(UPLOAD_DIR, 'medium'));
	await ensureDirectoryExists(path.join(UPLOAD_DIR, 'thumbnails'));

	// Convert file to buffer
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	// Save original
	const originalFilename = `${baseFilename}.${extension}`;
	const originalPath = path.join(UPLOAD_DIR, 'original', originalFilename);
	await fs.writeFile(originalPath, buffer);

	// Process and save resized versions
	const sharpInstance = sharp(buffer);
	const metadata = await sharpInstance.metadata();

	// Large version (1200x1200 max)
	const largeFilename = `${baseFilename}.webp`;
	const largePath = path.join(UPLOAD_DIR, 'large', largeFilename);
	await sharp(buffer)
		.resize(SIZES.large.width, SIZES.large.height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: 85 })
		.toFile(largePath);

	// Medium version (600x600 max)
	const mediumFilename = `${baseFilename}.webp`;
	const mediumPath = path.join(UPLOAD_DIR, 'medium', mediumFilename);
	await sharp(buffer)
		.resize(SIZES.medium.width, SIZES.medium.height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: 80 })
		.toFile(mediumPath);

	// Thumbnail (150x150 cover)
	const thumbnailFilename = `${baseFilename}.webp`;
	const thumbnailPath = path.join(UPLOAD_DIR, 'thumbnails', thumbnailFilename);
	await sharp(buffer)
		.resize(SIZES.thumbnail.width, SIZES.thumbnail.height, {
			fit: 'cover',
			position: 'centre'
		})
		.webp({ quality: 75 })
		.toFile(thumbnailPath);

	// Return web-accessible paths (without 'static' prefix)
	return {
		originalPath: `/uploads/original/${originalFilename}`,
		largePath: `/uploads/large/${largeFilename}`,
		mediumPath: `/uploads/medium/${mediumFilename}`,
		thumbnailPath: `/uploads/thumbnails/${thumbnailFilename}`
	};
}

export async function deleteImageFiles(imagePaths: ProcessedImages): Promise<void> {
	const baseDir = dev ? 'static' : 'build/client';
	const pathsToDelete = [
		path.join(baseDir, imagePaths.originalPath),
		path.join(baseDir, imagePaths.largePath),
		path.join(baseDir, imagePaths.mediumPath),
		path.join(baseDir, imagePaths.thumbnailPath)
	];

	for (const filePath of pathsToDelete) {
		try {
			await fs.unlink(filePath);
		} catch (err) {
			// File might not exist, ignore error
			console.warn(`Could not delete file ${filePath}:`, err);
		}
	}
}

export async function getImageInfo(
	filePath: string
): Promise<{ width: number; height: number; format: string } | null> {
	try {
		const baseDir = dev ? 'static' : 'build/client';
		const fullPath = path.join(baseDir, filePath);
		const metadata = await sharp(fullPath).metadata();
		return {
			width: metadata.width || 0,
			height: metadata.height || 0,
			format: metadata.format || 'unknown'
		};
	} catch {
		return null;
	}
}
