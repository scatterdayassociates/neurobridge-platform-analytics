import { useEffect, useRef, useState } from "react";

type Props = {
  data: any[];
  layout?: any;
  config?: any;
  className?: string;
  style?: React.CSSProperties;
};

export default function PlotlyChart({ data, layout, config, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [Plotly, setPlotly] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import("plotly.js-dist-min").then((m) => {
      if (mounted) setPlotly(m.default ?? m);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!Plotly || !ref.current) return;
    Plotly.react(
      ref.current,
      data,
      {
        autosize: true,
        margin: { l: 56, r: 16, t: 8, b: 44 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { family: "ui-sans-serif, system-ui, sans-serif", size: 12, color: "#0f1f3a" },
        hoverlabel: { bgcolor: "#0b1d3a", bordercolor: "#0b1d3a", font: { color: "#fff", size: 12 } },
        showlegend: false,
        ...layout,
      },
      { displayModeBar: false, responsive: true, ...config },
    );
    const onResize = () => Plotly.Plots.resize(ref.current!);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [Plotly, data, layout, config]);

  return <div ref={ref} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}
