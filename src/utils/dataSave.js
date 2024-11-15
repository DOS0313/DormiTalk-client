const fs = require('fs').promises;
const path = require('path');

async function saveJsonToFile(filename, data, dir = 'data') {
    try {
        await fs.mkdir(dir, { recursive: true });
        
        const filePath = path.join(dir, `${filename}.json`);
        
        const jsonString = JSON.stringify(data, null, 2);
        
        await fs.writeFile(filePath, jsonString, 'utf8');
        console.log(`[APISyncService] 파일이 성공적으로 저장되었습니다: ${filePath}`);
    } catch (error) {
        console.error('[APISyncService] 파일 저장 중 오류 발생:', error);
        throw error;
    }
}

async function readJsonFromFile(filename, dir = 'data') {
    try {
        const filePath = path.join(dir, `${filename}.json`);
        
        const jsonString = await fs.readFile(filePath, 'utf8');
        
        const data = JSON.parse(jsonString);
        return data;
    } catch (error) {
        console.error('[APISyncService] 파일 읽기 중 오류 발생:', error);
        throw error;
    }
}

module.exports = {
    saveJsonToFile,
    readJsonFromFile
};