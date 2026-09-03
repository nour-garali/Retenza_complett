const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let venvPython = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
if (!fs.existsSync(venvPython)) venvPython = 'python';

const bridgeScript = path.join(__dirname, 'chatbot_stream_bridge.py');
const payload = JSON.stringify({
    user_message: 'hi',
    email: 'ghofrane.khadhar@gmail.com',
    commerce_id: 'commerce_local_1',
    commerce_name: 'Boutique Tunis',
    client_name: 'Ghofrane',
    history: []
});

console.log('Testing spawn:', venvPython, bridgeScript);

const proc = spawn(venvPython, [bridgeScript], {
    cwd: __dirname,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});

proc.stdin.write(payload);
proc.stdin.end();

proc.stdout.on('data', (d) => {
    console.log('STDOUT DATA:', d.toString('utf-8'));
});

proc.stderr.on('data', (d) => {
    console.log('STDERR DATA:', d.toString('utf-8'));
});

proc.on('close', (code) => {
    console.log('Process closed with code:', code);
});
