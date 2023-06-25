const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { stdin, stdout, argv } = process;

let currentPath = path.resolve(os.homedir());

function startManager() {
    const name = argv.slice(2)[0].split('=')[1];
    stdout.write(`Welcome to the File Manager, ${name}!\nYou are currently in ${currentPath}\nPrint your command!\n\n`);
    stdin.on('data', (data) => {
        const dataArr = data.toString().split(' ');
        switch (dataArr[0].trim()) {
            case 'up':
                goUp();
                break;
            case 'cd':
                changeDirectory(dataArr[1].trim());
                break;
            case 'ls':
                printList();
                break;
            case 'cat':
                readFile(dataArr[1].trim());
                break;
            case 'add':
                createFile(dataArr[1].trim());
                break;
            case 'rn':
                renameFile(dataArr[1].trim(), dataArr[2].trim());
                break;
            case '.exit':
                process.exit();
            default: stdout.write('Invalid input\n\n');
                break;
        }
    })

    process.on('SIGINT', () => { process.exit() })
    process.on('exit', () => { stdout.write(`Thank you for using File Manager, ${name}, goodbye!\n`) })
}

function goUp() {
    if (currentPath === os.homedir()) return;
    stdout.write('Wait...\n')
    currentPath = path.resolve(currentPath, '..');
    stdout.write(`You are currently in ${currentPath}\n\n`);
}

function changeDirectory(newPath) {
    stdout.write('Wait...\n')
    new Promise((resolve, reject) => fs.access(path.resolve(currentPath, newPath), err => { !err ? resolve() : reject(err) }))
        .then(() => {
            currentPath = path.resolve(currentPath, newPath);
            stdout.write(`You are currently in ${currentPath}\n\n`)
        })
        .catch(() => {
            stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
        })
}

function printList() {
    stdout.write('Wait...\n')
    const headerRow = '┌─────────────┬──────────────────────────────────────────────────────────────────────────────────────────────┬────────────────────┐';
    const headerStr = '│   (index)   │                                             Name                                             │        Type        │'
    const middleRow = '├─────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────┤';
    const lowerRow = '└─────────────┴──────────────────────────────────────────────────────────────────────────────────────────────┴────────────────────┘\n';

    let outStr = `${headerRow}\n${headerStr}\n${middleRow}\n`;
    fs.readdir(currentPath, (err, files) => {
        if (err) {
            stdout.write('Operation failed\n\n');
            return;
        }

        files.forEach((fileName, index) => {
            let type = 'file';
            const filePath = path.join(currentPath, fileName);
            new Promise(resolve => {
                fs.stat(filePath, (err, stat) => {
                    resolve(stat.isDirectory() ? 'directory' : 'file')
                })
            }).then(res => {
                type = res;
                const indexStr = index.toString();
                const curIndexCell = '│' + `${index}`.padStart(Math.floor((13 - indexStr.length) / 2) + indexStr.length, ' ').padEnd(13, ' ');

                const curNameCell = '│' + `"${fileName}"`.padStart(Math.floor((94 - fileName.length) / 2) + fileName.length, ' ').padEnd(94, ' ');

                const curTypeCell = '│' + `"${type}"`.padStart(Math.floor((20 - type.length) / 2) + type.length, ' ').padEnd(20, ' ') + '│';

                let curStr = curIndexCell + curNameCell + curTypeCell;
                curStr += index !== files.length - 1 ? `\n${middleRow}\n` : `\n${lowerRow}\n`;
                outStr += curStr;
            }).then(() => {
                if (index === files.length - 1) {
                    stdout.write(outStr);
                    stdout.write(`You are currently in ${currentPath}\n\n`);
                }
            })
        })
    })
}

function readFile(readPath) {
    stdout.write('Wait...\n')
    const filePath = path.resolve(currentPath, readPath);
    const readableStream = fs.createReadStream(filePath);
    readableStream.on('data', data => { stdout.write(data) });
    readableStream.on('end', () => { stdout.write(`\n\nYou are currently in ${currentPath}\n\n`) });
    readableStream.on('error', () => { stdout.write('Operation failed\n\n') });
}

function createFile(fileName) {
    new Promise((resolve, reject) => {
        fs.writeFile(path.resolve(currentPath, fileName), '', err => {
            !err ? resolve() : reject()
        })
    })
        .then(() => {
            stdout.write(`You are currently in ${currentPath}\n\n`);
        })
        .catch(() => {
            stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
        })
}

function renameFile(oldPath, newPath) {
    const oldFilePath = path.resolve(currentPath, oldPath);
    const newFilePath = path.resolve(currentPath, newPath);
    new Promise((resolve, reject) => {
        fs.rename(oldFilePath, newFilePath, err => {
            !err ? resolve() : reject();
        })
    })
        .then(() => {
            stdout.write(`You are currently in ${currentPath}\n\n`);
        })
        .catch(() => {
            stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
        })
}

startManager()

//─ ┐ │ └ ┘ ┌ 