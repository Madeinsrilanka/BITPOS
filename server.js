const express = require('express');
const cors = require('cors');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API to get video information
app.get('/api/info', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Video URL is required' });
    }

    try {
        // We use youtube-dl-exec to fetch info
        const info = await youtubedl(url, {
            dumpJson: true,
            noWarnings: true,
            noCheckCertificate: true,
        });

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            formats: info.formats
        });
    } catch (error) {
        console.error('Error fetching info:', error);
        res.status(500).json({ error: 'Failed to fetch video information. Ensure the URL is valid.' });
    }
});

// API to download video
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

app.get('/api/download', async (req, res) => {
    const { url, format, title, type } = req.query;

    if (!url) {
        return res.status(400).send('Video URL is required');
    }

    // Generate a unique file name
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 10000);
    
    // Explicitly determine extension based on the requested type
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    
    const outputPath = path.join(__dirname, `temp_${uniqueId}.${ext}`);
    const downloadFileName = title ? `${title}.${ext}` : `Pixelstream_Video.${ext}`;

    try {
        const dlOptions = {
            noWarnings: true,
            noCheckCertificate: true,
            output: outputPath,
            ffmpegLocation: ffmpegPath, // Use ffmpeg-static to guarantee merging works
        };

        if (format) {
            dlOptions.format = format;
        }

        if (ext === 'mp4') {
            dlOptions.mergeOutputFormat = 'mp4';
        } else if (ext === 'mp3') {
            dlOptions.extractAudio = true;
            dlOptions.audioFormat = 'mp3';
        }

        // Wait for download and merge to finish
        await youtubedl(url, dlOptions);

        // Send the file to the user
        res.download(outputPath, downloadFileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).send('Error downloading file');
                }
            }
            // Clean up the temporary file
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        });

    } catch (error) {
        console.error('Error processing download:', error);
        res.status(500).send('Download failed. Ensure FFMPEG is installed.');
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try closing other server instances.`);
    } else {
        console.error('Server error:', err);
    }
});
