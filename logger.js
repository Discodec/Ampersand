const fs = require('fs');
const path =require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

function log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    console.log(formattedMessage, ...args);
    
    const fileMessage = args.length ? `${formattedMessage} ${JSON.stringify(args)}` : formattedMessage;
    logFile.write(fileMessage + '\n');
}

const logger = {
    info: (message, ...args) => log('info', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    error: (message, ...args) => {
        const err = args[0] instanceof Error ? args[0] : new Error(JSON.stringify(args[0] || 'Unknown error'));
        const errorMessage = `${message} - ${err.stack || err.message}`;
        log('error', errorMessage);
    }
};

module.exports = logger;