// Global state management
let currentFile = null;
let analysisResult = null;
let isAnalysisLoading = false;
let researchState = {
    isLoading: false,
    progress: 0,
    statusMessage: "Ready to start research",
    elapsedTime: 0,
    streamingContent: '',
    results: {}
};

// SSE connection states
let sseConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    error: null
};

// Timer references
let timerRef = null;
let sseController = null;

// DOM elements
const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileUploadBtn = document.getElementById('file-upload-btn');
const fileInput = document.getElementById('file-input');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const modeSelector = document.getElementById('mode-selector');

// Research display elements
const progressSection = document.getElementById('progress-section');
const stagesContainer = document.getElementById('stages-container');
const streamingSection = document.getElementById('streaming-section');
const defaultState = document.getElementById('default-state');
const progressFill = document.getElementById('progress-fill');
const statusMessage = document.getElementById('status-message');
const progressPercent = document.getElementById('progress-percent');
const timer = document.getElementById('timer');
const stopBtn = document.getElementById('stop-btn');
const streamingOutput = document.getElementById('streaming-output');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateConnectionStatus();
    showDefaultState();
});

// Event listeners setup
function initializeEventListeners() {
    // Send button click
    sendButton.addEventListener('click', handleSendMessage);
    
    // Enter key in textarea (Ctrl+Enter for new line)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // File upload button
    fileUploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Stop research button
    stopBtn.addEventListener('click', stopResearch);
    
    // Update send button state when input changes
    userInput.addEventListener('input', updateSendButtonState);
    
    // Initial button state
    updateSendButtonState();
}

// Message handling
function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage('user', message);
    userInput.value = '';
    updateSendButtonState();
    
    // Add loading message
    addMessage('loading', 'Analyzing...');
    
    // Start query analysis
    handleQueryAnalysis(message);
}

function addMessage(type, content, data = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    if (type === 'loading') {
        messageDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${content}</span>
        `;
    } else if (type === 'analysis' && data) {
        messageDiv.innerHTML = `
            <strong>Query Analysis</strong>
            <div style="margin-top: 8px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 12px;">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
            <button onclick="handleGenerate()" style="margin-top: 8px; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Generate Research
            </button>
        `;
    } else {
        messageDiv.textContent = content;
    }
    
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMessages = chatLog.querySelectorAll('.loading-message');
    loadingMessages.forEach(msg => msg.remove());
}

// File handling
function handleFileUpload(file) {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        addMessage('system', 'File size exceeds 10MB limit.');
        return;
    }
    
    currentFile = file;
    addMessage('system', `File "${file.name}" uploaded successfully.`);
}

// Query analysis with SSE
async function handleQueryAnalysis(query) {
    isAnalysisLoading = true;
    
    const payload = {
        query: query,
        design_doc: currentFile ? await readFileContent(currentFile) : ""
    };
    
    try {
        await connectQuerySSE(payload);
    } catch (error) {
        console.error('Query analysis error:', error);
        removeLoadingMessage();
        addMessage('system', `Analysis failed: ${error.message}`);
        isAnalysisLoading = false;
    }
}

// SSE connection for query analysis
async function connectQuerySSE(payload) {
    updateConnectionStatus('connecting');
    
    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        updateConnectionStatus('connected');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        handleQueryComplete();
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        handleQuerySSEEvent(parsed);
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', data);
                    }
                }
            }
        }
    } catch (error) {
        updateConnectionStatus('error');
        throw error;
    }
}

function handleQuerySSEEvent(data) {
    if (data.error) {
        removeLoadingMessage();
        addMessage('system', `Analysis failed: ${data.error}`);
        isAnalysisLoading = false;
        return;
    }
    
    if (data.result) {
        analysisResult = data.result;
        removeLoadingMessage();
        addMessage('analysis', 'Query Analysis Complete', data.result);
        isAnalysisLoading = false;
    }
}

function handleQueryComplete() {
    updateConnectionStatus('disconnected');
    isAnalysisLoading = false;
}

// Research generation
function handleGenerate() {
    if (!analysisResult) {
        addMessage('system', 'Please analyze a query first before generating research results.');
        return;
    }
    
    if (researchState.isLoading) {
        addMessage('system', 'A research task is already in progress');
        return;
    }
    
    startResearch();
}

async function startResearch() {
    // Reset state
    researchState = {
        isLoading: true,
        progress: 0,
        statusMessage: "Initializing Research Workflow...",
        elapsedTime: 0,
        streamingContent: '',
        results: {}
    };
    
    // Show progress section
    showProgressSection();
    
    // Start timer
    timerRef = setInterval(() => {
        researchState.elapsedTime++;
        updateTimer();
    }, 1000);
    
    const payload = {
        query: analysisResult.Query || "Research query",
        query_analysis_result: analysisResult,
        with_paper: modeSelector.value === "paper",
        with_example: modeSelector.value === "inspiration",
        is_drawing: false
    };
    
    try {
        await connectResearchSSE(payload);
    } catch (error) {
        console.error('Research generation error:', error);
        addMessage('system', `Research failed: ${error.message}`);
        stopResearch();
    }
}

// SSE connection for research
async function connectResearchSSE(payload) {
    updateConnectionStatus('connecting');
    
    if (sseController) {
        sseController.abort();
    }
    
    sseController = new AbortController();
    
    try {
        const response = await fetch('/api/research', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(payload),
            signal: sseController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        updateConnectionStatus('connected');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        handleResearchComplete();
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        handleResearchSSEEvent(parsed);
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', data);
                    }
                } else if (line.startsWith('event: ')) {
                    const eventType = line.slice(7);
                    // Handle different event types if needed
                }
            }
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            updateConnectionStatus('error');
            throw error;
        }
    }
}

function handleResearchSSEEvent(data) {
    if (data.type === 'chunk') {
        researchState.streamingContent += data.text || data.data || '';
        updateStreamingOutput();
    } else if (data.type === 'progress') {
        researchState.progress = data.progress || 0;
        updateProgress();
    } else if (data.type === 'status') {
        researchState.statusMessage = data.status || '';
        updateStatus();
    } else if (data.type === 'node_complete') {
        handleNodeComplete(data);
    } else if (data.type === 'error') {
        addMessage('system', `Research Error: ${data.message || data.error}`);
        stopResearch();
    }
}

function handleNodeComplete(data) {
    if (data.node && data.result) {
        const stageInfo = getStageInfo(data.node);
        if (stageInfo) {
            researchState.results[data.node] = data.result;
            addStage(stageInfo, data.result);
        }
    }
}

function handleResearchComplete() {
    researchState.isLoading = false;
    researchState.progress = 100;
    researchState.statusMessage = 'Research Complete';
    
    updateConnectionStatus('disconnected');
    updateProgress();
    updateStatus();
    hideStreamingSection();
    
    if (timerRef) {
        clearInterval(timerRef);
        timerRef = null;
    }
    
    addMessage('system', 'Research workflow completed successfully!');
    
    // Hide stop button
    stopBtn.style.display = 'none';
}

function stopResearch() {
    if (sseController) {
        sseController.abort();
        sseController = null;
    }
    
    researchState.isLoading = false;
    researchState.statusMessage = 'Research Stopped';
    
    updateConnectionStatus('disconnected');
    updateStatus();
    hideStreamingSection();
    
    if (timerRef) {
        clearInterval(timerRef);
        timerRef = null;
    }
    
    stopBtn.style.display = 'none';
    addMessage('system', 'Research workflow stopped by user');
}

// UI update functions
function updateConnectionStatus(status = 'disconnected') {
    sseConnectionState.isConnected = status === 'connected';
    sseConnectionState.isConnecting = status === 'connecting';
    sseConnectionState.error = status === 'error' ? 'Connection error' : null;
    
    statusIndicator.className = `status-indicator ${status}`;
    
    switch (status) {
        case 'connected':
            statusText.textContent = 'Connected';
            break;
        case 'connecting':
            statusText.textContent = 'Connecting...';
            break;
        case 'error':
            statusText.textContent = 'Connection Error';
            break;
        default:
            statusText.textContent = 'Disconnected';
    }
}

function updateSendButtonState() {
    const hasText = userInput.value.trim().length > 0;
    sendButton.disabled = !hasText || isAnalysisLoading;
    
    if (hasText && !isAnalysisLoading) {
        sendButton.style.backgroundColor = '#3b82f6';
        sendButton.style.color = 'white';
    } else {
        sendButton.style.backgroundColor = 'rgba(156, 163, 175, 0.2)';
        sendButton.style.color = '#6b7280';
    }
}

function showProgressSection() {
    defaultState.style.display = 'none';
    progressSection.style.display = 'block';
    stopBtn.style.display = 'block';
    
    updateProgress();
    updateStatus();
    updateTimer();
}

function showDefaultState() {
    progressSection.style.display = 'none';
    stagesContainer.innerHTML = '';
    streamingSection.style.display = 'none';
    defaultState.style.display = 'flex';
}

function updateProgress() {
    progressFill.style.width = `${researchState.progress}%`;
    progressPercent.textContent = `${researchState.progress}%`;
}

function updateStatus() {
    statusMessage.textContent = researchState.statusMessage;
}

function updateTimer() {
    const minutes = Math.floor(researchState.elapsedTime / 60);
    const seconds = researchState.elapsedTime % 60;
    timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateStreamingOutput() {
    if (researchState.streamingContent) {
        streamingSection.style.display = 'block';
        streamingOutput.textContent = researchState.streamingContent;
        streamingOutput.scrollTop = streamingOutput.scrollHeight;
    }
}

function hideStreamingSection() {
    streamingSection.style.display = 'none';
    researchState.streamingContent = '';
}

function addStage(stageInfo, data) {
    const stageDiv = document.createElement('div');
    stageDiv.className = 'stage';
    
    stageDiv.innerHTML = `
        <div class="stage-header" onclick="toggleStage(this)">
            <div class="stage-info">
                <div class="stage-icon completed">${stageInfo.emoji}</div>
                <div class="stage-details">
                    <h3>${stageInfo.title}</h3>
                    <div class="stage-status">Completed</div>
                </div>
            </div>
            <div class="toggle-icon">▼</div>
        </div>
        <div class="stage-content">
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
    `;
    
    stagesContainer.appendChild(stageDiv);
}

function toggleStage(header) {
    const stage = header.parentElement;
    const content = stage.querySelector('.stage-content');
    const icon = header.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

function getStageInfo(nodeType) {
    const stageMap = {
        'rag': { title: 'Knowledge Retrieval', emoji: '🔍' },
        'paper': { title: 'Knowledge Retrieval', emoji: '🔍' },
        'example': { title: 'Knowledge Retrieval', emoji: '🔍' },
        'domain_expert': { title: 'Domain Expert Analysis', emoji: '🧠' },
        'interdisciplinary': { title: 'Interdisciplinary Enhancement', emoji: '🔬' },
        'evaluation': { title: 'Solution Evaluation', emoji: '⚖️' },
        'persistence': { title: 'Solution Evaluation', emoji: '⚖️' }
    };
    
    return stageMap[nodeType] || null;
}

// Utility functions
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Make functions globally available
window.handleGenerate = handleGenerate;
window.toggleStage = toggleStage;
