export type MediaUploadItem =
	| { kind: 'local'; id: string; file: File; preview: string }
	| { kind: 'remote'; id: string; url: string };

export type MediaUploadLocalItem = Extract<MediaUploadItem, { kind: 'local' }>;

export function previewUrl(item: MediaUploadItem | undefined): string {
	if (!item) return '';
	return item.kind === 'local' ? item.preview : item.url;
}

export function fileFingerprint(file: File): string {
	return `${file.name}\0${file.size}\0${file.lastModified}`;
}
