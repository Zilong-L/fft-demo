import { useState, useMemo } from 'react';
import FftVisualizer from './components/FftVisualizer';
import SineWaveExplanation from './components/SineWaveExplanation';
import ComplexExplanation from './components/ComplexExplanation';

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

// Function to calculate FFT (existing)
function fft(y: number[], sr: number): { freq: number[]; mag: number[] } {
  const N = y.length;
  const numFreqBins = Math.floor(N / 2);
  const mag = new Array(numFreqBins).fill(0);
  const freq = Array.from({ length: numFreqBins }, (_, i) => (i * sr) / N);

  for (let k = 0; k < numFreqBins; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += y[n] * Math.cos(angle);
      im -= y[n] * Math.sin(angle);
    }
    mag[k] = Math.sqrt(re ** 2 + im ** 2);
  }

  return { freq, mag };
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
  const numFreqBins = Math.floor(N / 2);

  const { t, y } = useMemo(() => generateWave(sr, duration, amp20), [amp20, sr, duration]);
  const { freq, mag } = useMemo(() => fft(y, sr), [y, sr]);
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

      <label>
        20Hz Amplitude: {amp20.toFixed(2)} {/* Updated label */}
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
