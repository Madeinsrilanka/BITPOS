document.addEventListener('DOMContentLoaded', () => {
    const downloadForm = document.getElementById('downloadForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const fetchBtn = document.getElementById('fetchBtn');
    const btnText = fetchBtn.querySelector('.btn-text');
    const btnSpinner = document.getElementById('btnSpinner');
    const errorMsg = document.getElementById('errorMsg');

    const resultsSection = document.getElementById('resultsSection');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoDuration = document.getElementById('videoDuration');

    const videoFormatsContainer = document.getElementById('video-formats');
    const audioFormatsContainer = document.getElementById('audio-formats');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });

            // Add active to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            targetContent.classList.add('active');
            targetContent.style.display = 'grid';
        });
    });

    function formatTime(seconds) {
        if (!seconds) return 'Unknown';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s].filter(Boolean).join(':');
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return 'Unknown Size';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Since frontend is on Netlify and backend is on VPS, set the VPS API URL here.
    // Replace 'http://YOUR_VPS_IP_OR_DOMAIN:3000' with your actual VPS URL.
    // If testing locally, you can leave it as empty string '' to use relative path.
    const BACKEND_URL = 'http://localhost:3000';

    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = videoUrlInput.value.trim();
        if (!url) return;

        // Reset UI
        errorMsg.style.display = 'none';
        resultsSection.style.display = 'none';
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
        fetchBtn.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/api/info?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch video');
            }

            // Populate Info
            videoTitle.textContent = data.title;
            videoThumbnail.src = data.thumbnail;
            videoDuration.textContent = `Duration: ${formatTime(data.duration)}`;

            // Process Formats
            videoFormatsContainer.innerHTML = '';
            audioFormatsContainer.innerHTML = '';

            const audioFormats = [];

            // Filter unique qualities to avoid duplicates, but PREFER H.264 (avc1)
            const videoFormatsMap = new Map();
            const seenAudioQualities = new Set();

            // Reverse to get higher qualities first usually
            const formats = data.formats.reverse();

            formats.forEach(f => {
                // Video formats (has video, maybe audio too, or separate video)
                if (f.vcodec !== 'none' && f.height) {
                    const existing = videoFormatsMap.get(f.height);
                    
                    // Codec preference: avc1 (H.264) > vp09 > av01
                    const getCodecScore = (codec) => {
                        if (!codec) return 0;
                        if (codec.startsWith('avc1')) return 3; // Best compatibility
                        if (codec.startsWith('vp09')) return 2;
                        if (codec.startsWith('av01')) return 1; // Needs Windows extension
                        return 0;
                    };

                    const currentScore = getCodecScore(f.vcodec);
                    const existingScore = existing ? getCodecScore(existing.vcodec) : -1;

                    if (!existing || currentScore > existingScore) {
                        videoFormatsMap.set(f.height, f);
                    }
                }
                // Audio formats (no video, has audio)
                else if (f.vcodec === 'none' && f.acodec !== 'none') {
                    if (!seenAudioQualities.has(f.abr || f.format_id)) {
                        seenAudioQualities.add(f.abr || f.format_id);
                        audioFormats.push(f);
                    }
                }
            });

            const videoFormats = Array.from(videoFormatsMap.values());

            // Sort video formats descending by height
            videoFormats.sort((a, b) => b.height - a.height);
            audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));

            // Generate Video Buttons
            if (videoFormats.length === 0) {
                videoFormatsContainer.innerHTML = '<p>No video formats found.</p>';
            } else {
                videoFormats.forEach(f => {
                    const btn = document.createElement('a');
                    btn.className = 'download-btn';
                    
                    let targetFormat = f.format_id;
                    if (f.acodec === 'none') {
                        // Prefer m4a (AAC) audio so Windows Media Player can play it natively
                        targetFormat = `${f.format_id}+bestaudio[ext=m4a]/bestaudio`;
                    }

                    const safeTitle = data.title.replace(/[^a-zA-Z0-9 ]/g, "").trim();
                    btn.href = `${BACKEND_URL}/api/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(targetFormat)}&title=${encodeURIComponent(safeTitle)}&type=video`;
                    btn.setAttribute('download', '');

                    btn.innerHTML = `
                        <span class="format-quality">${f.height}p</span>
                        <span class="format-ext">${f.ext || 'mp4'}</span>
                        <span class="format-size">${formatBytes(f.filesize || f.filesize_approx)}</span>
                    `;
                    videoFormatsContainer.appendChild(btn);
                });
            }

            // Generate Audio Buttons
            if (audioFormats.length === 0) {
                audioFormatsContainer.innerHTML = '<p>No audio formats found.</p>';
            } else {
                audioFormats.slice(0, 5).forEach(f => { // limit to top 5
                    const btn = document.createElement('a');
                    btn.className = 'download-btn';
                    
                    const safeTitle = data.title.replace(/[^a-zA-Z0-9 ]/g, "").trim();
                    btn.href = `${BACKEND_URL}/api/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(f.format_id)}&title=${encodeURIComponent(safeTitle)}&type=audio`;
                    btn.setAttribute('download', '');

                    btn.innerHTML = `
                        <span class="format-quality">${f.abr ? f.abr + ' kbps' : 'Audio'}</span>
                        <span class="format-ext">${f.ext || 'm4a'}</span>
                        <span class="format-size">${formatBytes(f.filesize || f.filesize_approx)}</span>
                    `;
                    audioFormatsContainer.appendChild(btn);
                });
            }

            // Show results
            resultsSection.style.display = 'flex';

        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        } finally {
            // Restore button
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
            fetchBtn.disabled = false;
        }
    });
});
