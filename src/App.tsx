import { useState, useMemo } from 'react';
import FftVisualizer from './components/FftVisualizer';
import SineWaveExplanation from './components/SineWaveExplanation';
import ComplexExplanation from './components/ComplexExplanation';
import Plot from 'react-plotly.js';

type TabName = "sineWave" | "complex" | "fft";

// Generates a wave with 10Hz and 20Hz components
function generateWave(sr: number, duration: number, amp20: number): { t: number[]; y: number[] } {
  const N = sr * duration;
  const t = Array.from({ length: N }, (_, i) => i / sr);
  const y = t.map(ti =>
    Math.sin(2 * Math.PI * 10 * ti) + amp20 * Math.sin(2 * Math.PI * 20 * ti) // Using 10Hz and 20Hz
  );
  return { t, y };
}

// Generates a triangle wave with 10Hz and 20Hz components
function generateTriangleWave(sr: number, duration: number, amp20: number): { t: number[]; y: number[] } {
  const N = sr * duration;
  const t = Array.from({ length: N }, (_, i) => i / sr);
  function triangle(f: number, ti: number) {
    return 2 * Math.abs(2 * ((ti * f) % 1) - 1) - 1;
  }
  const y = t.map(ti =>
    triangle(10, ti) + amp20 * triangle(20, ti)
  );
  return { t, y };
}

// Generates a square wave with 10Hz and 20Hz components
function generateSquareWave(sr: number, duration: number, amp20: number): { t: number[]; y: number[] } {
  const N = sr * duration;
  const t = Array.from({ length: N }, (_, i) => i / sr);
  function square(f: number, ti: number) {
    return Math.sign(Math.sin(2 * Math.PI * f * ti));
  }
  const y = t.map(ti =>
    square(10, ti) + amp20 * square(20, ti)
  );
  return { t, y };
}

// Function to calculate FFT (existing)
function fft(y: number[], sr: number, nfft?: number): { freq: number[]; mag: number[]; re: number[]; im: number[] } {
  const N = nfft ?? y.length;
  // Zero-padding if needed
  const yPadded = N > y.length ? [...y, ...Array(N - y.length).fill(0)] : y.slice(0, N);
  const numFreqBins = Math.floor(N / 2);
  const mag = new Array(numFreqBins).fill(0);
  const re = new Array(numFreqBins).fill(0);
  const im = new Array(numFreqBins).fill(0);
  const freq = Array.from({ length: numFreqBins }, (_, i) => (i * sr) / N);

  for (let k = 0; k < numFreqBins; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += yPadded[n] * Math.cos(angle);
      imag -= yPadded[n] * Math.sin(angle);
    }
    re[k] = real;
    im[k] = imag;
    mag[k] = Math.sqrt(real ** 2 + imag ** 2);
  }

  return { freq, mag, re, im };
}

// 逆FFT：用频谱合成时域波形（只用前半谱，假设实信号）
function ifft(re: number[], im: number[], nfft: number): number[] {
  const N = nfft;
  const y = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    let sum = 0;
    for (let k = 0; k < re.length; k++) {
      const angle = (2 * Math.PI * k * n) / N;
      let scale = 2;
      if (k === 0 || (N % 2 === 0 && k === N / 2)) scale = 1; // DC 和 Nyquist 不翻倍
      sum += scale * (re[k] * Math.cos(angle) - im[k] * Math.sin(angle)) / N;
    }
    y[n] = sum;
  }

  return y;
}

// Function to calculate contributions of each sample to a specific frequency bin k
function calculateContributions(y: number[], k: number): { realContrib: number[]; imagContrib: number[] } {
  const N = y.length;
  const realContrib = new Array(N).fill(0);
  const imagContrib = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * k * n) / N;
    realContrib[n] = y[n] * Math.cos(angle);
    imagContrib[n] = -y[n] * Math.sin(angle); // Note the negative sign matches the FFT imaginary part calculation
  }

  return { realContrib, imagContrib };
}


function App() {
  const [activeTab, setActiveTab] = useState<TabName>("sineWave"); // Start with sine wave explanation
  const [amp20, setAmp20] = useState(0.0);
  const sr = 256;
  const duration = 1;
  const N = sr * duration; // Number of samples
  const [waveType, setWaveType] = useState<'sine' | 'triangle' | 'square'>('sine'); // NEW
  const [nfft, setNfft] = useState(N); // 默认与采样点数一致

  // Select generator based on waveType
  const { t, y } = useMemo(() => {
    if (waveType === 'triangle') return generateTriangleWave(sr, duration, amp20);
    if (waveType === 'square') return generateSquareWave(sr, duration, amp20);
    return generateWave(sr, duration, amp20);
  }, [amp20, sr, duration, waveType]);

  const { freq, mag, re, im } = useMemo(() => fft(y, sr, nfft), [y, sr, nfft]);
  const numFreqBins = Math.floor(nfft / 2);

  // 合成波形（逆FFT）
  const ySynth = useMemo(() => ifft(re, im, nfft), [re, im, nfft]);
  const tSynth = useMemo(() => Array.from({ length: nfft }, (_, i) => i / sr), [nfft, sr]);

  const [selectedFreqIndex, setSelectedFreqIndex] = useState(10); // Default to index 10 (10 Hz)
  const [showSine, setShowSine] = useState(true); // State to toggle sine component
  const [showCosine, setShowCosine] = useState(true); // State to toggle cosine component

  // Calculate contributions for the selected frequency
  const { realContrib, imagContrib } = useMemo(() => {
    return calculateContributions(y, selectedFreqIndex);
  }, [y, selectedFreqIndex]);

  // Calculate the actual frequency value for the selected index
  const selectedFrequencyHz = (selectedFreqIndex * sr) / N;

  // Calculate sine and cosine components for the selected frequency
  const sineComponent = t.map(ti => Math.sin(2 * Math.PI * selectedFrequencyHz * ti));
  const cosineComponent = t.map(ti => Math.cos(2 * Math.PI * selectedFrequencyHz * ti));

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem' }}>🎵 Fourier Visualizer (TS)</h1>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button onClick={() => setActiveTab("sineWave")} style={{ padding: '0.5rem 1rem', background: activeTab === "sineWave" ? '#ddd' : 'white' }}>
          1. Sine Wave Explanation
        </button>
        <button onClick={() => setActiveTab("complex")} style={{ padding: '0.5rem 1rem', background: activeTab === "complex" ? '#ddd' : 'white' }}>
          2. Complex Explanation
        </button>
        <button onClick={() => setActiveTab("fft")} style={{ padding: '0.5rem 1rem', background: activeTab === "fft" ? '#ddd' : 'white' }}>
          3. FFT Visualizer
        </button>
      </div>

      {/* Only show controls for FFT Visualizer tab, and place them under the navigation */}
      {activeTab === "fft" && (
        <div style={{ marginTop: '1rem' }}>
          <label>
            20Hz Amplitude: {amp20.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={amp20}
              onChange={e => setAmp20(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          {/* Waveform selector */}
          <div style={{ margin: '0.5rem 0' }}>
            <label>
              <input
                type="radio"
                name="waveType"
                value="sine"
                checked={waveType === 'sine'}
                onChange={() => setWaveType('sine')}
              /> Sine
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="radio"
                name="waveType"
                value="triangle"
                checked={waveType === 'triangle'}
                onChange={() => setWaveType('triangle')}
              /> Triangle
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="radio"
                name="waveType"
                value="square"
                checked={waveType === 'square'}
                onChange={() => setWaveType('square')}
              /> Square
            </label>
          </div>

          {/* nfft设置 */}
          <div style={{ margin: '0.5rem 0' }}>
            <label>
              FFT长度 nfft: {nfft}
              <input
                type="range"
                min={32}
                max={1024}
                step={1}
                value={nfft}
                onChange={e => {
                  // 只允许2的幂
                  let val = parseInt(e.target.value, 10);
                  // 找到离val最近的2的幂
                  val = Math.pow(2, Math.round(Math.log2(val)));
                  setNfft(val);
                }}
                style={{ width: '100%' }}
              />
            </label>
          </div>

          {/* 合成波形对比图 */}
          <Plot
            data={[
              { x: t, y: y, type: 'scatter', mode: 'lines', name: '原始波形' },
              { x: tSynth, y: ySynth, type: 'scatter', mode: 'lines', name: '合成波形', line: { color: 'red' } }
            ]}
            layout={{ title: '原始波形 vs 合成波形（逆FFT）', xaxis: { title: 'Time (s)' }, height: 300 }}
          />
        </div>
      )}

      {activeTab === "sineWave" && (
        <SineWaveExplanation />
      )}

      {activeTab === "complex" && (
        <ComplexExplanation />
      )}

      {activeTab === "fft" && (
        <FftVisualizer
          t={t}
          y={y}
          freq={freq}
          mag={mag}
          selectedFreqIndex={selectedFreqIndex}
          setSelectedFreqIndex={setSelectedFreqIndex}
          showSine={showSine}
          setShowSine={setShowSine}
          showCosine={showCosine}
          setShowCosine={setShowCosine}
          sineComponent={sineComponent}
          cosineComponent={cosineComponent}
          realContrib={realContrib}
          imagContrib={imagContrib}
          selectedFrequencyHz={selectedFrequencyHz}
          numFreqBins={numFreqBins}
        />
      )}
    </div>
  );
}

export default App;
