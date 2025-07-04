
function addLMMessage(message) {
    var lmMessage = document.createElement('p');
    lmMessage.className = 'lm-message';
    lmMessage.textContent = message;
    document.getElementById('chat-log').appendChild(lmMessage);
}


document.getElementById('send-button').addEventListener('click', function() {
    var userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    // 插入用户消息到聊天记录
    var userMessage = document.createElement('p');
    userMessage.className = 'user-message';
    userMessage.textContent = userInput;
    document.getElementById('chat-log').appendChild(userMessage);

    // 模拟 LLM 响应（此处可以替换为实际的 API 调用）
    

    var dataToSend = {
        query: userInput,
        design_doc: userInput
    };

    fetch('/api/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
    })
    .then(response => response.json())
    .then(data => {
        console.log('POST response data:', data);
        // document.getElementById('result').innerText = `Result: ${data.result}`;
        var lmMessage = document.createElement('p');
        lmMessage.className = 'lm-message';
        lmMessage.textContent = data;
        document.getElementById('chat-log').appendChild(lmMessage);
    })
    .catch(error => console.error('Error fetching data:', error));

    // 清空输入框
    document.getElementById('user-input').value = '';

    // 自动滚动到最新消息
    document.getElementById('chat-log').scrollTop = document.getElementById('chat-log').scrollHeight;
});
