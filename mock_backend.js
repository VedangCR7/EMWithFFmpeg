const http = require('http');
const url = require('url');

// In-memory storage for jobs
const jobs_db = {};

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// Mock video processing function
function mockProcessVideo(jobId) {
    if (!jobs_db[jobId]) return;
    
    const job = jobs_db[jobId];
    job.status = 'processing';
    
    // Simulate processing steps
    const steps = [
        { name: 'Initializing video processing...', progress: 10 },
        { name: 'Processing canvas layers...', progress: 30 },
        { name: 'Rendering video frames...', progress: 60 },
        { name: 'Applying effects and animations...', progress: 80 },
        { name: 'Finalizing video output...', progress: 95 },
        { name: 'Video processing complete!', progress: 100 }
    ];
    
    let stepIndex = 0;
    
    const processStep = () => {
        if (job.status === 'cancelled' || stepIndex >= steps.length) {
            if (stepIndex >= steps.length) {
                job.status = 'completed';
                job.download_url = `http://localhost:8000/downloads/${jobId}.mp4`;
                job.thumbnail_url = `http://localhost:8000/thumbnails/${jobId}.jpg`;
                job.estimated_time_remaining = 0;
                console.log(`Job ${jobId} completed successfully!`);
            }
            return;
        }
        
        const step = steps[stepIndex];
        job.progress = step.progress;
        console.log(`Job ${jobId}: ${step.name} (${step.progress}%)`);
        
        stepIndex++;
        setTimeout(processStep, 2000); // 2 seconds per step
    };
    
    processStep();
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Health check endpoint
    if (path === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Mock Video Processing Backend'
        }));
        return;
    }
    
    // Root endpoint
    if (path === '/') {
        res.writeHead(200);
        res.end(JSON.stringify({
            message: 'EventMarketers Mock Video Processing API',
            version: '1.0.0',
            status: 'running'
        }));
        return;
    }
    
    // Queue status endpoint
    if (path === '/api/video-processing/queue/status') {
        const queuedJobs = Object.values(jobs_db).filter(job => job.status === 'queued').length;
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            queueLength: queuedJobs,
            estimatedWaitTime: 15,
            averageProcessingTime: 15
        }));
        return;
    }
    
    // Job status endpoint
    if (path.startsWith('/api/video-processing/status/')) {
        const jobId = path.split('/').pop();
        const job = jobs_db[jobId];
        
        if (!job) {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'Job not found' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            jobId: jobId,
            status: job.status,
            progress: job.progress,
            downloadUrl: job.download_url,
            thumbnailUrl: job.thumbnail_url,
            estimatedTimeRemaining: job.estimated_time_remaining
        }));
        return;
    }
    
    // Submit job endpoint
    if (path === '/api/video-processing/process' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const jobId = Date.now().toString();
                
                // Create job
                const job = {
                    id: jobId,
                    status: 'queued',
                    progress: 0.0,
                    canvas_data: data.canvasData || {},
                    video_settings: data.videoSettings || {},
                    created_at: new Date().toISOString(),
                    download_url: null,
                    thumbnail_url: null,
                    estimated_time_remaining: 30
                };
                
                jobs_db[jobId] = job;
                
                // Start mock processing
                mockProcessVideo(jobId);
                
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    jobId: jobId,
                    status: 'queued',
                    estimatedTime: 30,
                    message: 'Video processing job submitted successfully'
                }));
                
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    // Download URL endpoint
    if (path.startsWith('/api/video-processing/download/')) {
        const jobId = path.split('/').pop();
        const job = jobs_db[jobId];
        
        if (!job) {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'Job not found' }));
            return;
        }
        
        if (job.status !== 'completed') {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'Video not ready for download' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            downloadUrl: job.download_url,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            fileSize: 15728640,
            fileName: `processed_video_${jobId}.mp4`
        }));
        return;
    }
    
    // Cancel job endpoint
    if (path.startsWith('/api/video-processing/cancel/') && req.method === 'DELETE') {
        const jobId = path.split('/').pop();
        const job = jobs_db[jobId];
        
        if (!job) {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'Job not found' }));
            return;
        }
        
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'Job cannot be cancelled' }));
            return;
        }
        
        job.status = 'cancelled';
        job.completed_at = new Date().toISOString();
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Job cancelled successfully' }));
        return;
    }
    
    // 404 for other paths
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log('🚀 Starting Mock Video Processing Backend...');
    console.log(`📚 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌐 API Root: http://localhost:${PORT}/api/video-processing/`);
    console.log('⏹️  Press Ctrl+C to stop the server');
    console.log('=' * 60);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use`);
        console.log('Try stopping any other services using port 8000');
    } else {
        console.log(`❌ Server error: ${err.message}`);
    }
});
