import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';

const SineWaveExplanation: React.FC = () => {
    const [sineFrequency, setSineFrequency] = useState(10); // Default to 10Hz
    const plotDuration = 2; // Show 2 seconds of the wave
    const plotSr = 100; // Sampling rate for the plot visualization
    const plotN = plotSr * plotDuration;
    const plotT = useMemo(() => Array.from({ length: plotN }, (_, i) => i / plotSr), [plotN, plotSr]);
    const sineWave = useMemo(() => {
        return plotT.map(ti => Math.sin(2 * Math.PI * sineFrequency * ti));
    }, [plotT, sineFrequency]);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2> 单频正弦波</h2>
            <label style={{ display: 'block', marginTop: '1rem', marginBottom: '1rem' }}>
                Wave Frequency: {sineFrequency.toFixed(1)} Hz
                <input
                    type="range"
                    min={1}
                    max={50} // Adjust max frequency as needed
                    step={0.5}
                    value={sineFrequency}
                    onChange={e => setSineFrequency(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                />
            </label>
            <Plot
                data={[
                    {
                        x: plotT,
                        y: sineWave,
                        type: 'scatter',
                        mode: 'lines',
                        name: `${sineFrequency.toFixed(1)}Hz Wave`,
                        line: { color: 'blue' }
                    }
                ]}
                layout={{
                    title: `${sineFrequency.toFixed(1)}Hz Sine Wave`,
                    xaxis: { title: 'Time (s)', range: [0, plotDuration] }, // Fix x-axis range
                    yaxis: { range: [-1.5, 1.5] }, // Fixed y-axis range
                    height: 300
                }}
            />
            <h3>（1）单频信号的样子</h3>
            <p>
                想象你有一个单纯的正弦波，比如：
                <br />
                x(t) = sin(2π ⋅ 10 t)
                <br />
                这表示一个 10Hz 的波，每秒震动 10 次。
            </p>
            <h3>（2）如何检测“10Hz”是否出现？</h3>
            <p>
                如果你不知道它是 10Hz，你可以拿一个“10Hz 的正弦模板”去跟它对比，看它们有多像。
            </p>
            <ul>
                <li>如果这两条波完全吻合，说明这个波里真的就有 10Hz</li>
            </ul>
            <p>
                你可以用<b>内积（点积）</b>或“在同一时刻把它们相乘，再把结果加起来”的方式来衡量相似度。
            </p>
            <ul>
                <li>相似度高 → 说明波形里真的有这个频率</li>
                <li>相似度低 → 说明波形跟该频率无关</li>
            </ul>
            <p>
                用这样的“匹配”思想，就可以从一大堆可能的频率中检测“谁在里面，谁不在里面”。
            </p>
        </div>
    );
};

export default SineWaveExplanation;
