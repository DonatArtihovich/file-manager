const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { pipeline } = require('node:stream');
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
      case 'cp':
        copyFile(dataArr[1].trim(), dataArr[2].trim());
        break;
      case 'mv':
        moveFile(dataArr[1].trim(), dataArr[2].trim());
        break;
      case 'rm':
        deleteFile(dataArr[1].trim());
        break;
      case 'os':
        getOSInfo(dataArr[1].trim());
        break;
      case 'hash':
        getHash(dataArr[1].trim());
        break;
      case 'compress':
        compressFile(dataArr[1].trim(), dataArr[2].trim());
        break;
      case 'decompress':
        decompressFile(dataArr[1].trim(), dataArr[2].trim());
        break;
      case '.exit':
        process.exit();
      default: stdout.write('Invalid input\n\n');
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
    const promisesArr = files.map((file, i) => {
      return new Promise(resolve => {
        let type = 'file';
        const filePath = path.join(currentPath, file);
        new Promise(resolve => {
          fs.stat(filePath, (err, stat) => {
            resolve(stat.isDirectory() ? 'directory' : 'file')
          })
        }).then(res => {
          type = res;
          const indexStr = i.toString();
          const curIndexCell = '│' + indexStr.padStart(Math.floor((13 - indexStr.length) / 2) + indexStr.length, ' ').padEnd(13, ' ');

          const curNameCell = '│' + `"${file}"`.padStart(Math.floor((94 - file.length) / 2) + file.length, ' ').padEnd(94, ' ');

          const curTypeCell = '│' + `"${type}"`.padStart(Math.floor((20 - type.length) / 2) + type.length, ' ').padEnd(20, ' ') + '│';

          let curStr = curIndexCell + curNameCell + curTypeCell;
          curStr += i !== files.length - 1 ? `\n${middleRow}\n` : `\n${lowerRow}\n`;
          resolve(curStr);
        })
      })
    })
    Promise.allSettled(promisesArr).then(res => {
      res.forEach(promise => {
        outStr += promise.value;
      })
    }).then(() => {
      stdout.write(outStr);
    })
      .then(() => {
        stdout.write(`You are currently in ${currentPath}\n\n`);
      })
      .catch(() => {
        stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
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

function copyFile(firstPath, secondPath) {
  const filePath = path.resolve(currentPath, firstPath);
  const copyPath = path.resolve(currentPath, secondPath);
  new Promise((resolve, reject) => {
    fs.copyFile(filePath, copyPath, err => {
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

function moveFile(oldPath, newPath) {
  const oldFilePath = path.resolve(currentPath, oldPath);
  const newFilePath = path.resolve(currentPath, newPath);
  new Promise((resolve, reject) => {
    fs.copyFile(oldFilePath, newFilePath, err => {
      !err ? resolve() : reject()
    })
  })
    .then(() => {
      fs.unlink(oldFilePath, err => {
        if (err) stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`);
      })
    })
    .then(() => {
      stdout.write(`You are currently in ${currentPath}\n\n`);
    })
    .catch(() => {
      stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
    })
}

function deleteFile(filePath) {
  const deletingFilePath = path.resolve(currentPath, filePath);
  new Promise((resolve, reject) => {
    fs.unlink(deletingFilePath, err => {
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

function getOSInfo(param) {
  switch (param) {
    case '--EOL':
      console.log(os.EOL);
      break;
    case '--cpus':
      console.log(os.cpus());
      break;
    case '--homedir':
      console.log(os.homedir());
      break;
    case '--username':
      console.log(os.userInfo().username);
      break;
    case '--architecture':
      console.log(os.arch());
      break;
    default: stdout.write('Invalid input\n\n');
  }
  stdout.write(`You are currently in ${currentPath}\n\n`);
}

function getHash(filePath) {
  const curFilePath = path.resolve(currentPath, filePath);
  const readableStream = fs.createReadStream(curFilePath);
  const hash = crypto.createHash('sha256');
  readableStream.on('data', data => { hash.update(data) });
  readableStream.on('end', () => { stdout.write(`${hash.digest('hex')}\n\n`) });
}

function compressFile(filePath, pathToCompress) {
  const file = path.resolve(currentPath, filePath);
  const compressedFile = path.resolve(currentPath, pathToCompress);
  const readableStream = fs.createReadStream(file);
  const writableStream = fs.createWriteStream(compressedFile, 'utf-8');
  const zip = zlib.createGzip();
  pipeline(readableStream, zip, writableStream, err => {
    if (err) throw err;
    !err ? stdout.write(`You are currently in ${currentPath}\n\n`)
      : stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
  });
}

function decompressFile(filePath, pathToDecompress) {
  const file = path.resolve(currentPath, filePath);
  const decompressedFile = path.resolve(currentPath, pathToDecompress);
  const readableStream = fs.createReadStream(file);
  const writableStream = fs.createWriteStream(decompressedFile, 'utf-8');
  const unzip = zlib.createGunzip();
  pipeline(readableStream, unzip, writableStream, err => {
    if (err) throw err;
    !err ? stdout.write(`You are currently in ${currentPath}\n\n`)
      : stdout.write(`Operation failed!\nYou are currently in ${currentPath}\n\n`)
  });
}

startManager()