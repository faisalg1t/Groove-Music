const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

class MusicCard {
	constructor() {
		this.registerFonts();
	}

	registerFonts() {
		try {
			const fontPaths = [
				{
					path: path.join(process.cwd(), '..', '..', 'fonts'),
					context: 'trackStart',
				},
				{
					path: path.join(process.cwd(), 'src', 'fonts'),
					context: 'command',
				},
				{ path: path.join(process.cwd(), 'fonts'), context: 'root' },
				{
					path: path.join(process.cwd(), 'assets', 'fonts'),
					context: 'assets',
				},
			];

			let fontsRegistered = false;

			for (const fontPath of fontPaths) {
				try {
					GlobalFonts.registerFromPath(
						path.join(fontPath.path, 'NotoSansJP-Bold.ttf'),
						'Noto Sans JP Bold',
					);
					GlobalFonts.registerFromPath(
						path.join(fontPath.path, 'NotoSansJP-Regular.ttf'),
						'Noto Sans JP',
					);
					GlobalFonts.registerFromPath(
						path.join(fontPath.path, 'Inter-Bold.ttf'),
						'Inter Bold',
					);
					GlobalFonts.registerFromPath(
						path.join(fontPath.path, 'Inter-SemiBold.ttf'),
						'Inter SemiBold',
					);
					GlobalFonts.registerFromPath(
						path.join(fontPath.path, 'Inter-Medium.ttf'),
						'Inter Medium',
					);
					GlobalFonts.registerFromPath(
						path.join(fontPath.path, 'Inter-Regular.ttf'),
						'Inter',
					);

					console.log(`[MusicCard] Fonts registered successfully from: ${fontPath.path} (${fontPath.context})`);
					fontsRegistered = true;
					break;
				} catch (e) {
					console.error(`Error while registering fonts from path: ${fontPath.path}: ${e}`);
					continue;
				}
			}

			if (!fontsRegistered) {
				console.warn('[MusicCard] Could not register custom fonts from any path. Using system defaults.');
			}
		} catch (e) {
			console.error('[MusicCard] Font registration error:', e);
		}
	}

	createFrostedGlass(ctx, x, y, width, height, radius = 15) {
		ctx.save();

		ctx.beginPath();
		ctx.roundRect(x, y, width, height, radius);
		ctx.clip();

		ctx.fillStyle = 'rgba(20, 25, 40, 0.4)';
		ctx.fillRect(x, y, width, height);

		for (let i = 0; i < 3; i++) {
			ctx.fillStyle = `rgba(100, 120, 160, ${0.05 - i * 0.015})`;
			ctx.filter = `blur(${2 + i}px)`;
			ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
		}
		ctx.filter = 'none';

		const innerGlow = ctx.createRadialGradient(
			x + width / 2,
			y + height / 2,
			0,
			x + width / 2,
			y + height / 2,
			Math.max(width, height) / 2,
		);
		innerGlow.addColorStop(0, 'rgba(180, 200, 220, 0.08)');
		innerGlow.addColorStop(1, 'rgba(180, 200, 220, 0)');
		ctx.fillStyle = innerGlow;
		ctx.fillRect(x, y, width, height);

		ctx.strokeStyle = 'rgba(180, 200, 220, 0.3)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.roundRect(x, y, width, height, radius);
		ctx.stroke();

		ctx.restore();
	}

	createFrostSnowflake(ctx, x, y, size, opacity = 0.3) {
		ctx.save();
		ctx.translate(x, y);

		ctx.shadowColor = `rgba(200, 220, 240, ${opacity * 0.4})`;
		ctx.shadowBlur = size * 0.8;

		ctx.fillStyle = `rgba(220, 230, 250, ${opacity})`;
		ctx.strokeStyle = `rgba(200, 220, 240, ${opacity * 0.8})`;
		ctx.lineWidth = size * 0.05;

		for (let i = 0; i < 6; i++) {
			ctx.rotate(Math.PI / 3);

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, -size);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(0, -size * 0.7);
			ctx.lineTo(-size * 0.15, -size * 0.55);
			ctx.moveTo(0, -size * 0.7);
			ctx.lineTo(size * 0.15, -size * 0.55);
			ctx.stroke();

			ctx.beginPath();
			ctx.arc(0, -size, size * 0.08, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.beginPath();
		ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(240, 245, 255, ${opacity})`;
		ctx.fill();

		ctx.restore();
	}

	createSnowflakeDecorations(ctx, width, height) {
		ctx.save();

		for (let i = 0; i < 4; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const size = 20 + Math.random() * 15;
			const opacity = 0.1 + Math.random() * 0.15;
			this.createFrostSnowflake(ctx, x, y, size, opacity);
		}

		for (let i = 0; i < 8; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const size = 10 + Math.random() * 10;
			const opacity = 0.15 + Math.random() * 0.2;
			this.createFrostSnowflake(ctx, x, y, size, opacity);
		}

		for (let i = 0; i < 15; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const size = 1 + Math.random() * 2;

			ctx.fillStyle = `rgba(220, 230, 250, ${0.2 + Math.random() * 0.3})`;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.restore();
	}

	createFrostText(ctx, text, x, y, fontSize, fontFamily, isTitle = false) {
		ctx.save();

		ctx.font = `${fontSize}px "${fontFamily}"`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';

		ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
		ctx.fillText(text, x + 1, y + 1);

		if (isTitle) {
			ctx.fillStyle = '#ffffff';
			ctx.shadowColor = 'rgba(200, 220, 240, 0.4)';
			ctx.shadowBlur = 8;
		} else {
			ctx.fillStyle = '#e0e8f0';
		}

		ctx.fillText(text, x, y);

		ctx.restore();
	}

	createFrostedProgressBar(ctx, x, y, width, height, progress) {
		ctx.save();

		ctx.beginPath();
		ctx.roundRect(x, y, width, height, height / 2);
		ctx.clip();

		ctx.fillStyle = 'rgba(30, 40, 60, 0.3)';
		ctx.fillRect(x, y, width, height);

		for (let i = 0; i < 2; i++) {
			ctx.filter = `blur(${3 + i * 2}px)`;
			ctx.fillStyle = `rgba(100, 130, 180, ${0.1 - i * 0.04})`;
			ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
		}
		ctx.filter = 'none';

		const innerHighlight = ctx.createLinearGradient(x, y, x, y + height);
		innerHighlight.addColorStop(0, 'rgba(200, 220, 240, 0.2)');
		innerHighlight.addColorStop(0.5, 'rgba(200, 220, 240, 0.05)');
		innerHighlight.addColorStop(1, 'rgba(200, 220, 240, 0.1)');
		ctx.fillStyle = innerHighlight;
		ctx.fillRect(x, y, width, height);

		if (progress > 0) {
			const progressWidth = width * progress;

			const progressGradient = ctx.createLinearGradient(
				x,
				y,
				x + progressWidth,
				y,
			);
			progressGradient.addColorStop(0, 'rgba(100, 180, 255, 0.7)');
			progressGradient.addColorStop(0.5, 'rgba(120, 190, 255, 0.8)');
			progressGradient.addColorStop(1, 'rgba(140, 200, 255, 0.7)');

			ctx.fillStyle = progressGradient;
			ctx.fillRect(x, y, progressWidth, height);

			const shine = ctx.createLinearGradient(x, y, x, y + height);
			shine.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
			shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
			shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
			ctx.fillStyle = shine;
			ctx.fillRect(x, y, progressWidth, height);
		}

		ctx.restore();

		ctx.strokeStyle = 'rgba(180, 200, 220, 0.4)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.roundRect(x, y, width, height, height / 2);
		ctx.stroke();

		if (progress > 0) {
			ctx.save();
			ctx.shadowColor = 'rgba(140, 200, 255, 0.8)';
			ctx.shadowBlur = 12;
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(
				x + width * progress,
				y + height / 2,
				height / 2 + 2,
				0,
				Math.PI * 2,
			);
			ctx.fill();

			ctx.fillStyle = 'rgba(140, 200, 255, 0.9)';
			ctx.beginPath();
			ctx.arc(
				x + width * progress,
				y + height / 2,
				height / 2 - 1,
				0,
				Math.PI * 2,
			);
			ctx.fill();
			ctx.restore();
		}
	}

	async drawArtwork(ctx, track, x, y, size) {
		ctx.save();

		try {
			const artworkUrl =
				track?.info?.artworkUrl || track?.pluginInfo?.artworkUrl;
			if (artworkUrl) {
				const artwork = await loadImage(artworkUrl);

				ctx.shadowColor = 'rgba(140, 180, 220, 0.3)';
				ctx.shadowBlur = 20;
				ctx.fillStyle = 'rgba(100, 140, 180, 0.1)';
				ctx.beginPath();
				ctx.roundRect(x, y, size, size, 18);
				ctx.fill();

				ctx.beginPath();
				ctx.roundRect(x, y, size, size, 18);
				ctx.clip();
				ctx.drawImage(artwork, x, y, size, size);

				const frostOverlay = ctx.createRadialGradient(
					x + size * 0.5,
					y + size * 0.5,
					0,
					x + size * 0.5,
					y + size * 0.5,
					size * 0.7,
				);
				frostOverlay.addColorStop(0, 'rgba(220, 230, 250, 0)');
				frostOverlay.addColorStop(0.7, 'rgba(180, 200, 220, 0.05)');
				frostOverlay.addColorStop(1, 'rgba(140, 180, 220, 0.1)');
				ctx.fillStyle = frostOverlay;
				ctx.fillRect(x, y, size, size);
			} else {
				throw new Error('No artwork URL available');
			}
		} catch (e) {
			console.error(`Error while creating frosted glass: ${e}`);
			this.createFrostedGlass(ctx, x, y, size, size, 18);
		}
		ctx.restore();

		ctx.save();
		ctx.strokeStyle = 'rgba(180, 200, 220, 0.4)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(x - 1, y - 1, size + 2, size + 2, 19);
		ctx.stroke();
		ctx.restore();
	}

	truncateText(ctx, text, maxWidth, font, ellipsis = '...') {
		ctx.font = font;
		if (ctx.measureText(text).width <= maxWidth) {
			return text;
		}

		let truncated = text;
		while (
			ctx.measureText(truncated + ellipsis).width > maxWidth &&
			truncated.length > 0
		) {
			truncated = truncated.slice(0, -1);
		}
		return truncated + ellipsis;
	}

	formatDuration(ms) {
		if (ms === null || ms === undefined || ms < 0) return '0:00';
		const seconds = Math.floor((ms / 1000) % 60)
			.toString()
			.padStart(2, '0');
		const minutes = Math.floor((ms / (1000 * 60)) % 60).toString();
		const hours = Math.floor(ms / (1000 * 60 * 60));
		if (hours > 0) {
			return `${hours}:${minutes.padStart(2, '0')}:${seconds}`;
		}
		return `${minutes}:${seconds}`;
	}

	async generateNowPlayingCard(options) {
		const { track, position = 0 } = options;
		
		const width = 780;
		const height = 260;
		const margin = 30;
		const artworkSize = 180;

		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');

		const artworkX = margin;
		const artworkY = margin;
		const infoX = artworkX + artworkSize + 30;
		const contentWidth = width - infoX - margin;

		try {
			const artworkUrl =
				track?.info?.artworkUrl || track?.pluginInfo?.artworkUrl;
			if (artworkUrl) {
				const artwork = await loadImage(artworkUrl);
				const scale = 1.2;
				const scaledWidth = width * scale;
				const scaledHeight = height * scale;
				const offsetX = (width - scaledWidth) / 2;
				const offsetY = (height - scaledHeight) / 2;

				ctx.save();
				ctx.filter = 'blur(10px)';
				ctx.drawImage(artwork, offsetX, offsetY, scaledWidth, scaledHeight);
				ctx.restore();

				ctx.save();
				ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
				ctx.fillRect(0, 0, width, height);
				ctx.restore();
			} else {
				const bgGradient = ctx.createRadialGradient(
					width * 0.5,
					height * 0.5,
					0,
					width * 0.5,
					height * 0.5,
					width * 0.7,
				);
				bgGradient.addColorStop(0, '#1a1f35');
				bgGradient.addColorStop(0.4, '#161b2e');
				bgGradient.addColorStop(0.7, '#141825');
				bgGradient.addColorStop(1, '#0f1320');
				ctx.fillStyle = bgGradient;
				ctx.fillRect(0, 0, width, height);
			}
		} catch (e) {
			console.error(`Error creating background: ${e}`);
			const bgGradient = ctx.createRadialGradient(
				width * 0.5,
				height * 0.5,
				0,
				width * 0.5,
				height * 0.5,
				width * 0.7,
			);
			bgGradient.addColorStop(0, '#1a1f35');
			bgGradient.addColorStop(0.4, '#161b2e');
			bgGradient.addColorStop(0.7, '#141825');
			bgGradient.addColorStop(1, '#0f1320');
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, width, height);
		}

		await this.drawArtwork(ctx, track, artworkX, artworkY, artworkSize);

		let currentY = artworkY + 15;

		const source = track?.info?.sourceName || 'Unknown';
		ctx.save();
		ctx.font = '18px "Inter Medium"';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
		ctx.shadowBlur = 12;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = '#a0b0c0';
		ctx.fillText(`Playing from ${source}`, infoX, currentY);
		ctx.restore();

		currentY += 30;

		const title = track?.info?.title || 'Unknown Title';
		const displayTitle = this.truncateText(
			ctx,
			title,
			contentWidth - 20,
			'38px "Inter Bold"',
		);

		ctx.save();
		ctx.font = '38px "Inter Bold"';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		
		ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
		ctx.shadowBlur = 20;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		
		ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		ctx.fillText(displayTitle, infoX + 2, currentY + 2);
		
		ctx.fillStyle = '#ffffff';
		ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
		ctx.shadowBlur = 15;
		ctx.fillText(displayTitle, infoX, currentY);
		ctx.restore();

		currentY += 52;

		const artist = track?.info?.author || 'Unknown Artist';
		const displayArtist = this.truncateText(
			ctx,
			artist,
			contentWidth - 20,
			'26px "Inter Medium"',
		);

		ctx.save();
		ctx.font = '26px "Inter Medium"';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
		ctx.shadowBlur = 12;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = '#e0e8f0';
		ctx.fillText(displayArtist, infoX, currentY);
		ctx.restore();

		currentY += 42;

		const isLive = !track?.info?.duration || track.info.duration <= 0;
		const currentTime = this.formatDuration(position);
		const totalTime = isLive
			? 'LIVE'
			: this.formatDuration(track?.info?.duration || 0);

		ctx.save();
		ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = '#a0b0c0';
		ctx.font = '18px "Inter Medium"';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.fillText(`${currentTime} / ${totalTime}`, infoX, currentY);
		ctx.restore();

		const bottomY = height - 35;

		ctx.save();
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';

		ctx.shadowColor = 'rgba(180, 200, 220, 0.5)';
		ctx.shadowBlur = 10;
		ctx.fillStyle = '#e0e8f0';
		ctx.font = '16px "Inter SemiBold"';
		ctx.fillText('Groove Music', width - margin - 10, bottomY);

		ctx.restore();

		return canvas.toBuffer('image/png');
	}
}

module.exports = { MusicCard };
