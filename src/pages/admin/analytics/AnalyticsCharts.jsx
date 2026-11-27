/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { Box, Chip, Paper, Stack, Tooltip, Typography } from "@mui/material";

export function KpiStatCard({
  title,
  value,
  subtext,
  delta,
  accentColor = "#03C75A",
  badge,
}) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(Number(delta));
  const positive = Number(delta) >= 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: accentColor,
          opacity: 0.9,
        }}
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
          {title}
        </Typography>
        {badge ? (
          <Chip label={badge} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700 }} />
        ) : null}
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap">
        <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: "-0.03em" }}>
          {value}
        </Typography>
        {hasDelta && (
          <Chip
            size="small"
            label={`${positive ? "+" : ""}${delta}%`}
            sx={{
              height: 20,
              fontSize: 11,
              fontWeight: 750,
              bgcolor: positive ? "rgba(3, 199, 90, 0.12)" : "rgba(240, 68, 82, 0.12)",
              color: positive ? "#008A49" : "#C92A38",
              border: "none",
            }}
          />
        )}
      </Stack>
      {subtext ? (
        <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.35 }}>
          {subtext}
        </Typography>
      ) : null}
    </Paper>
  );
}

export function TimeSeriesChart({
  data = [],
  series = [],
  height = 240,
  emptyText = "선택한 기간에 표시할 추이 데이터가 없습니다.",
  valueFormatter = (v) => Number(v || 0).toLocaleString(),
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const width = 760;
  const padLeft = 46;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const { maxVal, ticks } = useMemo(() => {
    let peak = 0;
    for (const row of data) {
      for (const s of series) {
        const val = Number(row?.[s.key] || 0);
        if (val > peak) peak = val;
      }
    }
    const safeMax = peak > 0 ? Math.ceil(peak * 1.15) : 10;
    return {
      maxVal: safeMax,
      ticks: [0, Math.round(safeMax * 0.5), safeMax],
    };
  }, [data, series]);

  if (!data.length || !series.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body2">
          {emptyText}
        </Typography>
      </Box>
    );
  }

  const n = data.length;
  const stepX = n > 1 ? innerW / n : innerW;
  const barW = Math.max(4, Math.min(26, stepX * 0.56));
  const xForIndex = (idx) =>
    n === 1 ? padLeft + innerW / 2 : padLeft + stepX * idx + stepX / 2;
  const yForValue = (val) => padTop + innerH - (Math.max(0, val) / maxVal) * innerH;

  const labelInterval = n <= 12 ? 1 : Math.ceil(n / 8);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        {series.map((s) => (
          <Stack key={s.key} direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: s.type === "line" ? 3 : 10,
                borderRadius: s.type === "line" ? 2 : 0.75,
                bgcolor: s.color,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              {s.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Box
        component="svg"
        viewBox={`0 0 ${width} ${height}`}
        sx={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {ticks.map((t) => {
          const y = yForValue(t);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#E5E9EF"
                strokeDasharray={t === 0 ? undefined : "3 3"}
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748B"
              >
                {t >= 10000 ? `${Math.round(t / 1000)}k` : t.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Bar series first */}
        {series
          .filter((s) => s.type !== "line")
          .map((s) =>
            data.map((row, idx) => {
              const val = Number(row?.[s.key] || 0);
              const x = xForIndex(idx) - barW / 2;
              const y = yForValue(val);
              const h = Math.max(0, padTop + innerH - y);
              return (
                <rect
                  key={`${s.key}-${idx}`}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(4, barW / 2)}
                  fill={s.color}
                  fillOpacity={hoverIdx === null || hoverIdx === idx ? 0.85 : 0.35}
                />
              );
            }),
          )}

        {/* Line series on top */}
        {series
          .filter((s) => s.type === "line")
          .map((s) => {
            const pts = data.map((row, idx) => `${xForIndex(idx)},${yForValue(Number(row?.[s.key] || 0))}`).join(" ");
            return (
              <g key={s.key}>
                {data.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={pts}
                  />
                )}
                {data.map((row, idx) => (
                  <circle
                    key={`${s.key}-pt-${idx}`}
                    cx={xForIndex(idx)}
                    cy={yForValue(Number(row?.[s.key] || 0))}
                    r={hoverIdx === idx ? 5 : 3}
                    fill="#FFFFFF"
                    stroke={s.color}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}

        {/* X axis labels */}
        {data.map((row, idx) => {
          if (idx % labelInterval !== 0 && idx !== n - 1) return null;
          const shortLabel = String(row.label || "").replace(/^\d{4}-/, "");
          return (
            <text
              key={`lbl-${idx}`}
              x={xForIndex(idx)}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#64748B"
            >
              {shortLabel}
            </text>
          );
        })}

        {/* Hover columns */}
        {data.map((row, idx) => (
          <rect
            key={`hit-${idx}`}
            x={padLeft + (innerW / n) * idx}
            y={padTop}
            width={innerW / n}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(idx)}
            style={{ cursor: "crosshair" }}
          />
        ))}
      </Box>

      {hoverIdx !== null && data[hoverIdx] && (
        <Paper
          variant="outlined"
          sx={{
            mt: 1,
            px: 1.5,
            py: 0.85,
            bgcolor: "#0F172A",
            color: "#FFFFFF",
            borderColor: "#0F172A",
            borderRadius: 1.5,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: "#E2E8F0" }}>
            {data[hoverIdx].label}
          </Typography>
          {series.map((s) => (
            <Typography key={s.key} variant="caption" sx={{ color: "#FFFFFF" }}>
              <Box
                component="span"
                sx={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", bgcolor: s.color, mr: 0.6 }}
              />
              {s.label}: <strong>{valueFormatter(data[hoverIdx][s.key], s.key)}</strong>
            </Typography>
          ))}
        </Paper>
      )}
    </Box>
  );
}

export function DonutChart({
  segments = [],
  centerLabel,
  centerValue,
  size = 160,
}) {
  const total = segments.reduce((acc, s) => acc + Math.max(0, Number(s.value || 0)), 0);
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems="center">
      <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#EEF2F6"
            strokeWidth={stroke}
          />
          {total > 0 &&
            segments.map((seg) => {
              const val = Math.max(0, Number(seg.value || 0));
              if (!val) return null;
              const dash = (val / total) * circ;
              const dashOffset = -offsetAcc;
              offsetAcc += dash;
              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
            })}
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.1 }}>
            {centerValue}
          </Typography>
          {centerLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
              {centerLabel}
            </Typography>
          )}
        </Box>
      </Box>
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        {segments.map((seg) => {
          const val = Number(seg.value || 0);
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
          return (
            <Stack
              key={seg.label}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                <Box
                  sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: seg.color, flexShrink: 0 }}
                />
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {seg.label}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 750, flexShrink: 0 }}>
                {val.toLocaleString()} ({pct}%)
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function HorizontalBarList({
  items = [],
  valueKey = "sessions",
  labelKey = "label",
  color = "#03C75A",
  unit = "",
  emptyText = "데이터가 없습니다.",
  secondaryRenderer,
}) {
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
        {emptyText}
      </Typography>
    );
  }
  const maxVal = Math.max(1, ...items.map((item) => Number(item?.[valueKey] || 0)));

  return (
    <Stack spacing={1.25}>
      {items.map((item, idx) => {
        const val = Number(item?.[valueKey] || 0);
        const pct = Math.max(2, Math.round((val / maxVal) * 100));
        return (
          <Box key={`${item[labelKey]}-${idx}`}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 650, minWidth: 0 }}>
                {item[labelKey]}
                {item.extra ? (
                  <Box component="span" sx={{ ml: 0.75, color: "text.secondary", fontWeight: 400, fontSize: 12 }}>
                    ({item.extra})
                  </Box>
                ) : null}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 750, flexShrink: 0 }}>
                {val.toLocaleString()}
                {unit}
                {item.share_pct !== undefined ? (
                  <Box component="span" sx={{ ml: 0.5, color: "text.secondary", fontWeight: 500, fontSize: 12 }}>
                    ({item.share_pct}%)
                  </Box>
                ) : null}
              </Typography>
            </Stack>
            {secondaryRenderer ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {secondaryRenderer(item)}
              </Typography>
            ) : null}
            <Box sx={{ mt: 0.4, height: 7, borderRadius: 4, bgcolor: "#EEF2F6", overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${pct}%`,
                  bgcolor: color,
                  borderRadius: 4,
                  transition: "width 240ms ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export function FunnelChart({ steps = [] }) {
  if (!steps.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
        퍼널 데이터가 없습니다.
      </Typography>
    );
  }
  const colors = ["#0F172A", "#1D4ED8", "#03C75A", "#008A49", "#6B38FB"];
  return (
    <Stack spacing={1.5}>
      {steps.map((step, idx) => (
        <Box key={step.key}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {idx + 1}. {step.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {Number(step.count || 0).toLocaleString()}명{" "}
              <Box component="span" sx={{ color: "text.secondary", fontWeight: 600, fontSize: 12 }}>
                ({step.pct}%)
              </Box>
            </Typography>
          </Stack>
          <Box sx={{ height: 14, borderRadius: 2, bgcolor: "#EEF2F6", overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                width: `${Math.max(step.count > 0 ? 3 : 0, Math.min(100, step.pct))}%`,
                bgcolor: colors[idx % colors.length],
                borderRadius: 2,
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function ActivityHeatmap({ cells = [] }) {
  const { grid, maxCount, peakCell } = useMemo(() => {
    const map = new Map();
    let maxV = 0;
    let peak = null;
    for (const c of cells) {
      const k = `${c.dow}:${c.hour}`;
      const val = Number(c.count || 0);
      map.set(k, val);
      if (val > maxV) {
        maxV = val;
        peak = c;
      }
    }
    return { grid: map, maxCount: maxV, peakCell: peak };
  }, [cells]);

  const cellColor = (val) => {
    if (!val || maxCount <= 0) return "#F1F5F9";
    const ratio = val / maxCount;
    if (ratio < 0.25) return "#CCF5DC";
    if (ratio < 0.5) return "#7FE3AA";
    if (ratio < 0.75) return "#1FD374";
    return "#008A49";
  };

  return (
    <Box>
      {peakCell && peakCell.count > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          최다 접속 시간대: <strong>{WEEKDAYS_KO[peakCell.dow]}요일 {peakCell.hour}시</strong> ({peakCell.count.toLocaleString()}회)
        </Typography>
      )}
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 620 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "36px repeat(24, minmax(18px, 1fr))", gap: 0.5, mb: 0.5 }}>
            <Box />
            {Array.from({ length: 24 }, (_, hr) => (
              <Typography key={hr} variant="caption" sx={{ fontSize: 10, color: "text.secondary", textAlign: "center" }}>
                {hr}
              </Typography>
            ))}
          </Box>
          {WEEKDAYS_KO.map((dayLabel, dow) => (
            <Box
              key={dayLabel}
              sx={{ display: "grid", gridTemplateColumns: "36px repeat(24, minmax(18px, 1fr))", gap: 0.5, mb: 0.5, alignItems: "center" }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", fontSize: 11 }}>
                {dayLabel}
              </Typography>
              {Array.from({ length: 24 }, (_, hr) => {
                const cnt = grid.get(`${dow}:${hr}`) || 0;
                return (
                  <Tooltip key={hr} title={`${dayLabel}요일 ${hr}시: ${cnt.toLocaleString()}회`}>
                    <Box
                      sx={{
                        height: 20,
                        borderRadius: 0.75,
                        bgcolor: cellColor(cnt),
                        border: "1px solid rgba(15, 23, 42, 0.04)",
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
