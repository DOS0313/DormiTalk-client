const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const { searchYouTube } = require('../services/youtubeService');
const { playAudio } = require('../services/playerService');

const execPromise = util.promisify(exec);

class CLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.start = this.start.bind(this);
    this.checkDependencies = this.checkDependencies.bind(this);
    this.askQuestion = this.askQuestion.bind(this);
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async start(config) {
    console.log('YouTube Music Player for Raspbian');
    await this.checkDependencies(config);

    while (true) {
      const query = await this.askQuestion('\nEnter a song to search (or "quit" to exit): ');
      
      if (query.toLowerCase() === 'quit') {
        this.rl.close();
        break;
      }

      const videos = await searchYouTube(query, config);
      if (videos.length === 0) {
        console.log('No results found.');
        continue;
      }

      console.log('\nSearch results:');
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
      });

      const choice = await this.askQuestion('\nEnter the number of the song to play: ');
      const index = parseInt(choice) - 1;

      if (index >= 0 && index < videos.length) {
        await playAudio(videos[index].id, videos[index].title, config, this.rl);
      } else {
        console.log('Invalid choice.');
      }
    }
  }

  async checkDependencies(config) {
    try {
      // which 명령어로 실행 파일의 전체 경로 찾기
      const findExecutable = async (command) => {
        try {
          const { stdout } = await execPromise(`which ${command}`);
          return stdout.trim();
        } catch (error) {
          return null;
        }
      };

      // yt-dlp 체크
      let ytdlpPath = config.ytdlp.path;
      if (!ytdlpPath.startsWith('/')) {
        // 설정된 경로가 상대 경로인 경우 which로 찾기
        ytdlpPath = await findExecutable('yt-dlp');
        if (!ytdlpPath) {
          throw new Error('yt-dlp not found in PATH');
        }
      }

      // mpv 체크
      let mpvPath = config.mpv.path;
      if (!mpvPath) {
        // 설정된 경로가 없는 경우 which로 찾기
        mpvPath = await findExecutable('mpv');
        if (!mpvPath) {
          throw new Error('mpv not found in PATH');
        }
      }

      // 버전 체크 실행
      const execOptions = {
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`
        }
      };

      const { stdout: ytdlpVersion } = await execPromise(`"${ytdlpPath}" --version`, execOptions);
      const { stdout: mpvVersion } = await execPromise(`"${mpvPath}" --version`, execOptions);

      console.log('yt-dlp path:', ytdlpPath);
      console.log('mpv path:', mpvPath);
      console.log('yt-dlp version:', ytdlpVersion.trim());
      console.log('mpv version:', mpvVersion.split('\n')[0]);

      // 성공한 경로로 설정 업데이트
      config.ytdlp.path = ytdlpPath;
      
    } catch (error) {
      console.error('Dependency check error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = CLI;