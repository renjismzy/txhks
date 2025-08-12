import './App.css';
import { useState, useEffect, useCallback, useRef } from 'react';

function App() {
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [level, setLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(10);
  const [unlockedLevels, setUnlockedLevels] = useState([0]);
  const buttonStyles = {
    padding: '10px 20px',
    margin: '5px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
    border: 'none',
    outline: 'none',
    color: 'white'
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [message, setMessage] = useState('欢迎来到外星信号解码游戏！选择难度开始。');
  const [flashingButton, setFlashingButton] = useState(null);
  const [buttonPulse, setButtonPulse] = useState(false);
  const [celebrationType, setCelebrationType] = useState('default');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [clickedButton, setClickedButton] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('alienGameHighScore') || '0');
  });
  const [difficulty, setDifficulty] = useState('normal');
  const difficultyLabels = {
    normal: '普通',
    hard: '困难',
    expert: '专家',
    insane: '疯狂'
  };
  const [gameStarted, setGameStarted] = useState(false);
  const handleDifficultySelect = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
  };
  const [streak, setStreak] = useState(0);
  const renderDifficultyButtons = () => {
    return Object.keys(difficultySettings).map((diff) => (
      <button
        key={diff}
        style={{
          ...buttonStyles,
          backgroundColor: difficultyColors[diff],
          transform: hoveredButton === diff ? 'scale(1.05)' : 'none',
          boxShadow: clickedButton === diff ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none'
        }}
        onClick={() => handleDifficultySelect(diff)}
        onMouseEnter={() => setHoveredButton(diff)}
        onMouseLeave={() => setHoveredButton(null)}
        onMouseDown={() => setClickedButton(diff)}
        onMouseUp={() => setClickedButton(null)}
      >
        {difficultyLabels[diff]}
      </button>
    ));
  };
  const [showCelebration, setShowCelebration] = useState(false);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);
  
  const audioContextRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const colors = ['red', 'blue', 'green', 'yellow'];
  const difficultyColors = {
    normal: '#4CAF50',
    hard: '#FF9800',
    expert: '#F44336',
    insane: '#9C27B0'
  };
  const soundEffects = {
    correct: 'correct.mp3',
    wrong: 'wrong.mp3',
    levelUp: 'levelUp.mp3',
    gameOver: 'gameOver.mp3'
  };
  
  // 音频频率映射
  const colorFrequencies = {
    red: 261.63,    // C4
    blue: 329.63,   // E4
    green: 392.00,  // G4
    yellow: 523.25  // C5
  };
  
  // 难度设置
  const difficultySettings = {
    normal: { speed: 500, scoreMultiplier: 2 },
    hard: { speed: 300, scoreMultiplier: 3 },
    expert: { speed: 150, scoreMultiplier: 5 },
    insane: { speed: 100, scoreMultiplier: 8 }
  };

  // 初始化音频上下文
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.log('音频不可用');
      }
    };
    initAudio();
  }, []);

  // 播放音效
  const playSound = useCallback((frequency, duration = 300) => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.log('音频播放失败');
    }
  }, []);

  // 振动反馈
  const vibrate = useCallback((pattern = [100]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const startGame = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    setSequence([]);
    setPlayerSequence([]);
    setLevel(1);
    setScore(0);
    setStreak(0);
    setIsPlaying(true);
    setMessage('注意信号序列...');
    generateSequence(1);
  };

  const generateSequence = (lvl) => {
    const newSequence = [];
    // 为第一级生成一个随机序列，之后每级添加一个新元素
    if (lvl === 1) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      newSequence.push(randomColor);
    } else {
      newSequence.push(...sequence);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      newSequence.push(randomColor);
    }
    setSequence(newSequence);
    playSequence(newSequence);
  };

  const playSequence = async (seq) => {
    setIsShowingSequence(true);
    setMessage(`级别 ${level} - 注意信号序列...`);
    
    // 等待一小段时间，让玩家准备好
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const speed = difficultySettings[difficulty].speed;
    
    for (let i = 0; i < seq.length; i++) {
      const color = seq[i];
      await highlightButton(color);
      if (i < seq.length - 1) {
        await new Promise(resolve => setTimeout(resolve, speed / 4));
      }
    }
    
    setIsShowingSequence(false);
    setMessage('现在轮到你重复序列！');
  };

  const highlightButton = (color) => {
    return new Promise((resolve) => {
      setFlashingButton(color);
      playSound(colorFrequencies[color]);
      vibrate([50]);
      
      const speed = difficultySettings[difficulty].speed;
      setTimeout(() => {
        setFlashingButton(null);
        setTimeout(resolve, speed / 4);
      }, speed / 2);
    });
  };

  const handleClick = (color) => {
    if (!isPlaying || isShowingSequence) return;
    
    // 添加按钮闪烁效果和音效
    setFlashingButton(color);
    playSound(colorFrequencies[color], 200);
    vibrate([30]);
    setTimeout(() => setFlashingButton(null), 200);
    
    const newPlayerSeq = [...playerSequence, color];
    setPlayerSequence(newPlayerSeq);
    
    // 检查当前输入是否正确
    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      // 错误音效
      playSound(150, 500);
      vibrate([200, 100, 200]);
      
      const finalScore = score;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('alienGameHighScore', finalScore.toString());
        setMessage(`新纪录！最终分数: ${finalScore}`);
      } else {
        setMessage(`游戏结束！最终分数: ${finalScore}`);
      }
      
      setIsPlaying(false);
      setGameStarted(false);
      return;
    }
    
    // 如果完成了当前序列
    if (newPlayerSeq.length === sequence.length) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // 计算分数
      const baseScore = level * 10;
      const difficultyBonus = Math.floor(baseScore * difficultySettings[difficulty].scoreMultiplier);
      const streakBonus = newStreak >= 3 ? Math.floor(baseScore * 0.5) : 0;
      const totalScore = score + difficultyBonus + streakBonus;
      
      setScore(totalScore);
      
      // 成功音效
      playSound(523.25, 200);
      setTimeout(() => playSound(659.25, 200), 100);
      vibrate([50, 50, 50]);
      
      // 特殊里程碑庆祝
      if (level % 5 === 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
      
      setMessage(`太棒了！级别 ${level} 完成！`);
      setLevel(level + 1);
      setPlayerSequence([]);
      
      setTimeout(() => {
        generateSequence(level + 1);
      }, 1500);
    }
  };

  // 重置游戏
  const resetGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setScore(0);
    setStreak(0);
    setIsPlaying(false);
    setIsShowingSequence(false);
    setGameStarted(false);
    setMessage('欢迎来到外星信号解码游戏！选择难度开始。');
  };

  // 暂停/继续游戏
  const togglePause = () => {
    if (isPlaying && !isShowingSequence) {
      setIsPlaying(false);
      setMessage('游戏已暂停，点击继续。');
    } else if (!isPlaying && gameStarted) {
      setIsPlaying(true);
      setMessage('现在轮到你重复序列！');
    }
  };

  return (
    <div className="App">
      <div className="cosmic-dust"></div>
      {showCelebration && <div className="celebration">🎉 里程碑达成！ 🎉</div>}
      
      <div className="game-container">
        <h1>外星信号解码</h1>
        
        <div className="score-board">
          <div className="score-item">
            <span className="score-label">分数</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-item">
            <span className="score-label">最高分</span>
            <span className="score-value high-score">{highScore}</span>
          </div>
          <div className="score-item">
            <span className="score-label">连击</span>
            <span className="score-value streak">{streak}</span>
          </div>
        </div>
        
        {!gameStarted && (
          <div className="difficulty-selector">
            <h3>选择难度</h3>
            <div className="difficulty-buttons">
              {Object.keys(difficultySettings).map((diff) => (
                <button
                  key={diff}
                  className={`difficulty-btn ${difficulty === diff ? 'selected' : ''}`}
                  data-difficulty={diff}
                  onClick={() => setDifficulty(diff)}
                >
                   {diff === 'normal' && '普通'}
                    {diff === 'hard' && '困难'}
                    {diff === 'expert' && '专家'}
                    {diff === 'insane' && '疯狂'}
                 </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="game-info">
          <p className="message">{message}</p>
          {gameStarted && <p className="level-info">级别: {level} | 难度: {difficulty === 'normal' ? '普通' : difficulty === 'hard' ? '困难' : difficulty === 'expert' ? '专家' : '疯狂'}</p>}
        </div>
        
        <div className="buttons">
          {colors.map((color) => (
            <button
              key={color}
              id={color}
              className={`game-button ${color} ${flashingButton === color ? 'flash' : ''} ${isShowingSequence ? 'disabled' : ''}`}
              onClick={() => handleClick(color)}
              disabled={isShowingSequence}
            />
          ))}
        </div>
        
        <div className="control-buttons">
          {!gameStarted ? (
            <button className="start-btn" onClick={startGame}>
              开始游戏
            </button>
          ) : (
            <>
              <button 
                className="pause-btn" 
                onClick={togglePause}
                disabled={isShowingSequence}
              >
                {isPlaying ? '暂停' : '继续'}
              </button>
              <button className="reset-btn" onClick={resetGame}>
                重新开始
              </button>
            </>
          )}
        </div>
        
        {gameStarted && (
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(playerSequence.length / sequence.length) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">{playerSequence.length}/{sequence.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;