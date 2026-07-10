import React from 'react';

/**
 * Editorial SVG-based Line Chart widget for visualizing performance metrics.
 * Bypasses heavy charting libraries while providing a premium, clean SVG path.
 */
const ChartWidget = ({ config }) => {
  const { title, labels = [], data = [] } = config.settings;

  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = data.length > 0 ? Math.max(...data) * 1.15 : 100;
  const minVal = 0;
  const valueRange = maxVal - minVal;

  // Generate SVG coordinates for each data point
  const points = data.map((val, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / valueRange) * chartHeight;
    return { x, y, val, label: labels[idx] };
  });

  // Create path command string
  const linePath = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Create area command string (under line) for gradient wash
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // Generate grid line y-positions (4 intervals)
  const gridLines = Array.from({ length: 4 }, (_, idx) => {
    const fraction = idx / 3;
    const y = paddingTop + fraction * chartHeight;
    const val = maxVal - fraction * valueRange;
    return { y, val };
  });

  return (
    <div className="chart-widget">
      <header className="chart-widget__header">
        <h3 className="chart-widget__title">{title || 'Performance Metric'}</h3>
        <span className="caption chart-widget__subtitle">Last 6 Months</span>
      </header>
      <div className="chart-widget__canvas-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-widget__svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gradient-sky-light, #cfe7ff)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--color-canvas, #ffffff)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="var(--color-hairline, #f0f0f3)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 8}
                y={line.y + 4}
                textAnchor="end"
                className="chart-widget__axis-label"
              >
                {Math.round(line.val).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Gradient fill under the line */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chart-area-grad)"
            />
          )}

          {/* Main line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-text-link, #0d74ce)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points & tooltips */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-point-group">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="var(--color-canvas, #ffffff)"
                stroke="var(--color-text-link, #0d74ce)"
                strokeWidth="2.5"
                className="chart-point"
              />
              {/* x-axis text labels */}
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="chart-widget__axis-label chart-widget__axis-label--x"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default ChartWidget;
