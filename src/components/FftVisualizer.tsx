import React from 'react';
import Plot from 'react-plotly.js';

interface FftVisualizerProps {
    t: number[];
    y: number[];
    freq: number[];
    mag: number[];
    selectedFreqIndex: number;
    setSelectedFreqIndex: (index: number) => void;
    showSine: boolean;
    setShowSine: (show: boolean) => void;
    showCosine: boolean;
    setShowCosine: (show: boolean) => void;
    sineComponent: number[];
    cosineComponent: number[];
    realContrib: number[];
    imagContrib: number[];
    selectedFrequencyHz: number;
    numFreqBins: number;
}

const FftVisualizer: React.FC<FftVisualizerProps> = ({
    t,
    y,
    freq,
    mag,
    selectedFreqIndex,
    setSelectedFreqIndex,
    showSine,
    setShowSine,
    showCosine,
    setShowCosine,
    sineComponent,
    cosineComponent,
    realContrib,
    imagContrib,
    selectedFrequencyHz,
    numFreqBins
}) => {
    return (
        <div className="">
            <label style={{ display: 'block', marginTop: '1rem' }}>
                Selected Frequency: {selectedFrequencyHz.toFixed(2)} Hz (Index: {selectedFreqIndex})
                <input
                    type="range"
                    min={0}
                    max={numFreqBins - 1} // Max index is numFreqBins - 1
                    step={1}
                    value={selectedFreqIndex}
                    onChange={e => setSelectedFreqIndex(parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                />
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'block' }}>
                    Show Sine Component
                    <input
                        type="checkbox"
                        checked={showSine}
                        onChange={e => setShowSine(e.target.checked)}
                        style={{ marginLeft: '0.5rem' }}
                    />
                </label>
                <label style={{ display: 'block' }}>
                    Show Cosine Component
                    <input
                        type="checkbox"
                        checked={showCosine}
                        onChange={e => setShowCosine(e.target.checked)}
                        style={{ marginLeft: '0.5rem' }}
                    />
                </label>
            </div>
            <Plot
                data={[
                    {
                        x: t,
                        y: y,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Waveform',
                    },
                    ...(showSine ? [{
                        x: t,
                        y: sineComponent,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Sine Component',
                        line: { color: 'green' }
                    }] : []),
                    ...(showCosine ? [{
                        x: t,
                        y: cosineComponent,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Cosine Component',
                        line: { color: 'orange' }
                    }] : []),
                ]}
                layout={{
                    title: 'Waveform with Components', xaxis: { title: 'Time (s)' }, height: 300, legend: {
                        x: 1,
                        xanchor: 'right',
                        y: 1
                    }
                }}
            />
            <Plot
                data={[
                    (showSine ? {
                        x: t,
                        y: imagContrib,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Sine Contribution',
                        line: { color: 'green' }
                    } : {}),
                    (showCosine ? {
                        x: t,
                        y: realContrib,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Cosine Contribution',
                        line: { color: 'orange' }
                    } : {}),
                ]}
                layout={{
                    title: `Sample Contributions to ${selectedFrequencyHz.toFixed(2)} Hz`,
                    xaxis: { title: 'Time (s)' },
                    yaxis: { title: 'Contribution Value' },
                    height: 300,
                    legend: {
                        x: 1,
                        xanchor: 'right',
                        y: 1
                    }
                }}
            />
            <Plot
                data={[
                    {
                        x: freq,
                        y: mag,
                        type: 'bar',
                        name: 'Spectrum',
                    },
                ]}
                layout={{ title: 'Frequency Spectrum', xaxis: { title: 'Hz' }, height: 300 }}
            />
        </div>
    );
};

export default FftVisualizer;
