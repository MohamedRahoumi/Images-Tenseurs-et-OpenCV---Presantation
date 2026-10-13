import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Image as ImgIcon, Grid3x3, Layers, Cpu, Sparkles, ArrowRight, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

/* ---------- données & utilitaires ---------- */
const fmt = (n) => n.toLocaleString("fr-FR");
const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
const gray = (p) => Math.round(0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]);
const txt = (p) => (gray(p) > 140 ? "#0f172a" : "#fff");
const scene = (u, v) => {
  u = Math.min(0.999, Math.max(0, u)); v = Math.min(0.999, Math.max(0, v));
  if ((u - 0.76) ** 2 + (v - 0.24) ** 2 < 0.011) return [250, 204, 21];
  if (v > 0.5 && v <= 0.72 && u > 0.28 && u < 0.36 && v > 0.6) return [90, 60, 40];
  if (v >= 0.5 && v <= 0.72 && u > 0.18 && u < 0.48) return [220, 70, 60];
  if (v >= 0.3 && v < 0.5 && Math.abs(u - 0.33) < (v - 0.3) * 1.0) return [70, 50, 110];
  if (v > 0.72) return [34, 139, 76];
  return [cl(90 + v * 80), cl(170 + v * 40), 235];
};
const getData = (w, h, f = scene) => Array.from({ length: w * h }, (_, i) => f(((i % w) + 0.5) / w, (Math.floor(i / w) + 0.5) / h));
const d3 = getData(3, 3), d4 = getData(4, 4), d5 = getData(5, 5), d8 = getData(8, 8), d16 = getData(16, 16);
const base = { w: 64, h: 48, d: getData(64, 48) };

/* ---------- composants visuels ---------- */
function Cv({ data, w, h, s = 4 }) {
  const r = useRef();
  useEffect(() => {
    const x = r.current.getContext("2d"), im = x.createImageData(w, h);
    data.forEach((p, i) => im.data.set([p[0], p[1], p[2], 255], i * 4));
    x.putImageData(im, 0, 0);
  }, [data, w, h]);
  return <canvas ref={r} width={w} height={h} style={{ width: w * s, height: h * s, imageRendering: "pixelated" }} className="rounded-lg shadow-md" />;
}
function Grid({ d, n, sel, onSel, vals, cell = 40, map, hi }) {
  return (
    <div className="inline-grid gap-px bg-slate-300 p-px rounded-lg overflow-hidden" style={{ gridTemplateColumns: `repeat(${n},${cell}px)` }}>
      {d.map((p, i) => {
        const c = map ? map(p) : p;
        return (
          <button key={i} onClick={() => onSel && onSel(i)}
            style={{ width: cell, height: cell, background: `rgb(${c})`, color: txt(c), fontSize: cell >= 40 ? 11 : 9 }}
            className={"flex items-center justify-center font-mono leading-tight whitespace-pre transition " + (sel === i ? "ring-4 ring-amber-400 z-10 scale-110 " : "") + (hi && hi.includes(i) ? "ring-4 ring-sky-500 z-10" : "")}>
            {vals ? vals(p, i) : ""}
          </button>
        );
      })}
    </div>
  );
}
function Stack({ d, n, cell = 18 }) {
  return (
    <div className="relative" style={{ width: n * cell + 40, height: n * cell + 40 }}>
      {[0, 1, 2].map((k) => (
        <div key={k} className="absolute" style={{ left: k * 20, top: k * 20, zIndex: k }}>
          <Grid d={d} n={n} cell={cell} map={(p) => p.map((v, j) => (j === k ? v : 0))} />
        </div>
      ))}
    </div>
  );
}
const Code = ({ children }) => <pre className="bg-slate-900 text-emerald-200 text-sm rounded-xl p-4 overflow-x-auto font-mono leading-relaxed shadow-inner">{children}</pre>;
const Card = ({ children, className = "" }) => <div className={"bg-white rounded-2xl border border-slate-200 shadow-sm p-4 " + className}>{children}</div>;
const Tag = ({ children, c = "indigo" }) => <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-${c}-100 text-${c}-700`}>{children}</span>;
const Lbl = ({ children }) => <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-2 text-center">{children}</div>;
const Arrow = () => <ArrowRight className="text-slate-400 shrink-0" size={28} />;
const xy = (i, n) => ({ x: i % n, y: Math.floor(i / n) });

/* ---------- opérations d'image (démo 64×48) ---------- */
const resz = (im, w, h) => ({ w, h, d: Array.from({ length: w * h }, (_, i) => im.d[Math.floor(((Math.floor(i / w) + 0.5) * im.h) / h) * im.w + Math.floor((((i % w) + 0.5) * im.w) / w)]) });
const crop = (im, x0, y0, w, h) => ({ w, h, d: Array.from({ length: w * h }, (_, i) => im.d[(y0 + Math.floor(i / w)) * im.w + x0 + (i % w)]) });
const flip = (im) => ({ ...im, d: im.d.map((_, i) => im.d[Math.floor(i / im.w) * im.w + (im.w - 1 - (i % im.w))]) });
const rot = (im) => ({ w: im.h, h: im.w, d: Array.from({ length: im.w * im.h }, (_, i) => im.d[(im.h - 1 - Math.floor(i / im.h)) * 0 + (im.h - 1 - (i % im.h)) * im.w + Math.floor(i / im.h)]) });
const grayIm = (im) => ({ ...im, d: im.d.map((p) => { const g = gray(p); return [g, g, g]; }) });

/* ---------- slides ---------- */
function S1() {
  const g4 = d4.map((p) => { const g = gray(p); return [g, g, g]; });
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-8">
      <div>
        <h1 className="text-5xl font-extrabold text-slate-800 leading-tight">Images, Tenseurs & <span className="text-indigo-600">OpenCV</span></h1>
        <p className="text-2xl text-slate-500 mt-2">Comprendre les données visuelles</p>
        <p className="text-lg text-indigo-500 font-medium mt-3">Des pixels aux tenseurs, jusqu'aux CNN</p>
      </div>
      <div className="flex items-center gap-5 flex-wrap justify-center">
        <div><Cv data={getData(48, 48)} w={48} h={48} s={3} /><Lbl>Image</Lbl></div><Arrow />
        <div><Grid d={d5} n={5} cell={30} /><Lbl>Pixels</Lbl></div><Arrow />
        <div><Grid d={g4} n={4} cell={36} vals={(p) => p[0]} /><Lbl>Matrice</Lbl></div><Arrow />
        <div><Stack d={d4} n={4} /><Lbl>Tenseur H×W×3</Lbl></div>
      </div>
    </div>
  );
}

function S2() {
  const [sel, setSel] = useState(27);
  const p = d8[sel], { x, y } = xy(sel, 8);
  return (
    <div className="grid md:grid-cols-3 gap-6 items-center">
      <div className="flex flex-col items-center gap-3">
        <Card className="space-y-2 w-full"><p className="text-slate-700">Une image est un <b>tableau de nombres</b> : chaque pixel stocke l'intensité de ses canaux de couleur, de 0 à 255.</p><Tag>Cliquez un pixel →</Tag></Card>
        <Cv data={getData(64, 64)} w={64} h={64} s={3} /><Lbl>Image 64×64 (aperçu)</Lbl>
      </div>
      <div className="flex flex-col items-center"><Grid d={d8} n={8} cell={42} sel={sel} onSel={setSel} /><Lbl>Grille 8×8 de pixels</Lbl></div>
      <Card className="space-y-3">
        <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-xl shadow" style={{ background: `rgb(${p})` }} /><div><div className="text-sm text-slate-500">Pixel sélectionné</div><div className="font-mono text-lg font-bold">x={x}, y={y}</div></div></div>
        {["R", "G", "B"].map((k, j) => (
          <div key={k}><div className="flex justify-between text-sm font-mono"><span>{k}</span><b>{p[j]}</b></div>
            <div className="h-2 bg-slate-100 rounded"><div className={"h-2 rounded " + ["bg-red-500", "bg-green-500", "bg-blue-500"][j]} style={{ width: (p[j] / 255) * 100 + "%" }} /></div></div>
        ))}
        <Code>{`image[${y}, ${x}]\n# → [${p.join(", ")}]  (R,G,B)`}</Code>
      </Card>
    </div>
  );
}

function S3() {
  const [sel, setSel] = useState(5);
  const p = d4[sel];
  const chs = [["Rouge", [1, 0, 0]], ["Vert", [0, 1, 0]], ["Bleu", [0, 0, 1]]];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3 text-center">
        {[["Pixel", "1 point"], ["height", "4 lignes"], ["width", "4 colonnes"], ["channels", "3 (R,G,B)"]].map(([a, b]) => <Card key={a}><div className="font-mono font-bold text-indigo-600">{a}</div><div className="text-sm text-slate-600">{b}</div></Card>)}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div><Grid d={d4} n={4} cell={60} sel={sel} onSel={setSel} /><Lbl>Image 4×4×3</Lbl></div><Arrow />
        {chs.map(([n, m], k) => <div key={n}><Grid d={d4} n={4} cell={44} sel={sel} onSel={setSel} map={(q) => q.map((v, j) => v * m[j])} vals={(q) => q[k]} /><Lbl>Canal {n}</Lbl></div>)}
      </div>
      <Card className="text-center font-mono">shape = (4, 4, 3) → pixel {JSON.stringify(xy(sel, 4))} = <b>[{p.join(", ")}]</b> : 3 composantes par pixel</Card>
    </div>
  );
}

function S4() {
  const i = 8 * 16 + 5, p = d16[i];
  const views = [["RGB (affichage correct)", d16, (q) => q], ["BGR lu comme RGB", d16, (q) => [q[2], q[1], q[0]]], ["Grayscale", d16, (q) => { const g = gray(q); return [g, g, g]; }]];
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-4 justify-center">{views.map(([n, d, f]) => <div key={n}><Cv data={d.map(f)} w={16} h={16} s={8} /><Lbl>{n}</Lbl></div>)}</div>
        <Card className="text-sm space-y-1"><p><b>OpenCV</b> charge les images en <b>BGR</b> avec cv2.imread(). Matplotlib attend du RGB : sans conversion, rouge et bleu sont inversés.</p>
          <p className="font-mono">Pixel de la maison : RGB {JSON.stringify(p)} → BGR [{p[2]}, {p[1]}, {p[0]}] → gris {gray(p)}</p>
          <p className="text-slate-500">Gris = 0.299·R + 0.587·G + 0.114·B → 1 seul canal, shape (H, W).</p></Card>
      </div>
      <Code>{`import cv2\n\nimage = cv2.imread("image.jpg")  # BGR\nimage_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)\nimage_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)\n\nprint(image.shape)       # (H, W, 3)\nprint(image_gray.shape)  # (H, W)`}</Code>
    </div>
  );
}

function S5() {
  const [sel, setSel] = useState(4);
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="flex flex-col items-center gap-3">
        <Grid d={d3} n={3} cell={84} sel={sel} onSel={setSel} vals={(p) => `${p[0]}\n${p[1]}\n${p[2]}`} />
        <Lbl>Image 3×3 — cliquez un pixel</Lbl>
        <div className="flex gap-2 flex-wrap justify-center"><Tag>shape=(3, 3, 3)</Tag><Tag c="emerald">dtype=uint8</Tag><Tag c="amber">valeurs 0 → 255</Tag></div>
      </div>
      <Card>
        <div className="text-sm text-slate-500 mb-2">Tableau NumPy associé (canaux R,G,B)</div>
        <div className="font-mono text-sm leading-7">
          {"array(["}
          {[0, 1, 2].map((r) => (
            <div key={r} className="pl-4">[{[0, 1, 2].map((c) => { const k = r * 3 + c; return <span key={c}><span onClick={() => setSel(k)} className={"cursor-pointer px-1 rounded " + (sel === k ? "bg-amber-300" : "hover:bg-slate-100")}>[{d3[k].join(", ")}]</span>{c < 2 ? ", " : ""}</span>; })}]{r < 2 ? "," : ""}</div>
          ))}
          {"], dtype=uint8)"}
        </div>
        <div className="mt-3 text-sm font-mono bg-amber-50 rounded-lg p-2">image[{xy(sel, 3).y}, {xy(sel, 3).x}] = [{d3[sel].join(", ")}]</div>
      </Card>
    </div>
  );
}

function S6() {
  const [fmtSel, setF] = useState("NHWC");
  const g = d4.map((p) => { const v = gray(p); return [v, v, v]; });
  const items = [["Scalaire", "7", "shape ()", null], ["Vecteur", "[7, 3, 9]", "shape (3,)", null], ["Matrice / image grayscale", "", "shape (H, W)", <Grid key="a" d={g} n={4} cell={16} />],
    ["Tenseur 3D / image couleur", "", "shape (H, W, 3)", <Stack key="b" d={d4} n={4} cell={14} />],
    ["Batch 4D", "", "(N, H, W, C)", <div key="c" className="relative w-24 h-24">{[0, 1, 2].map((k) => <div key={k} className="absolute w-14 h-14 rounded-lg border-2 border-indigo-400 bg-indigo-100" style={{ left: k * 14, top: k * 14 }} />)}</div>]];
  const t = fmtSel === "NHWC" ? ["batch_size", "height", "width", "channels"] : ["batch_size", "channels", "height", "width"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {items.map(([n, ex, sh, v]) => <Card key={n} className="flex flex-col items-center text-center gap-2 min-h-40"><div className="font-bold text-sm text-slate-800">{n}</div><div className="font-mono text-lg h-20 flex items-center">{ex || v}</div><Tag>{sh}</Tag></Card>)}
      </div>
      <Card>
        <div className="flex gap-2 mb-3">{["NHWC", "NCHW"].map((k) => <button key={k} onClick={() => setF(k)} className={"px-4 py-1.5 rounded-lg font-mono text-sm font-bold transition " + (fmtSel === k ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}>{k}</button>)}</div>
        <div className="flex gap-2 flex-wrap">{t.map((x, i) => <div key={x + i} className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-800 font-mono text-sm transition">{i}: {x}</div>)}</div>
        <p className="font-mono text-sm mt-3">{fmtSel === "NHWC" ? "(batch_size, height, width, channels) → TensorFlow / Keras, OpenCV+NumPy" : "(batch_size, channels, height, width) → PyTorch"}</p>
        <p className="font-mono text-xs text-slate-500 mt-1">x = np.transpose(x, (0, 3, 1, 2))  # NHWC → NCHW</p>
      </Card>
    </div>
  );
}

function S7() {
  const fns = [
    ["cv2.imread()", "Lit un fichier image → tableau NumPy BGR uint8. Retourne None si le chemin est invalide.", `img = cv2.imread("photo.jpg")\nprint(img.shape, img.dtype)  # (H, W, 3) uint8`],
    ["cv2.imshow()", "Affiche l'image dans une fenêtre (script local). En notebook : Colab → cv2_imshow, Jupyter → plt.imshow après conversion RGB.", `cv2.imshow("Fenêtre", img)\ncv2.waitKey(0); cv2.destroyAllWindows()\n\n# Colab :\nfrom google.colab.patches import cv2_imshow\ncv2_imshow(img)\n\n# Jupyter :\nimport matplotlib.pyplot as plt\nplt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))`],
    ["cv2.imwrite()", "Enregistre un tableau NumPy en fichier image (le format dépend de l'extension). Retourne True si réussi.", `ok = cv2.imwrite("sortie.png", img)\nprint(ok)  # True`],
    ["cv2.cvtColor()", "Convertit l'espace colorimétrique : BGR→RGB, BGR→GRAY, BGR→HSV…", `rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)\ngray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # (H, W)`],
    ["cv2.resize()", "Change la taille. Attention : l'argument est (largeur, hauteur), alors que shape = (hauteur, largeur).", `small = cv2.resize(img, (224, 224))\nprint(small.shape)  # (224, 224, 3)`],
  ];
  const [i, setI] = useState(0);
  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="space-y-2">{fns.map(([n], k) => <button key={n} onClick={() => setI(k)} className={"w-full text-left font-mono px-4 py-3 rounded-xl border transition " + (i === k ? "bg-indigo-600 text-white border-indigo-600 shadow" : "bg-white border-slate-200 hover:bg-slate-50")}>{n}</button>)}</div>
      <div className="md:col-span-2 space-y-3"><Card><p className="text-slate-700">{fns[i][1]}</p></Card><Code>{fns[i][2]}</Code></div>
    </div>
  );
}

function S8() {
  const ops = {
    orig: ["Original", (im) => im, "image = cv2.imread(\"image.jpg\")"],
    resize: ["Resize", (im) => resz(im, 32, 32), "resized = cv2.resize(image, (224, 224))"],
    crop: ["Crop", (im) => crop(im, 20, 8, 32, 32), "cropped = image[50:200, 100:300]"],
    flip: ["Flip", flip, "flipped = cv2.flip(image, 1)"],
    rot: ["Rotation 90°", rot, "rotated = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)"],
    gray: ["Grayscale", grayIm, "gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)"],
  };
  const [k, setK] = useState("orig");
  const im = useMemo(() => ops[k][1](base), [k]);
  const s = Math.max(2, Math.floor(256 / Math.max(im.w, im.h)));
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">{Object.entries(ops).map(([id, [n]]) => <button key={id} onClick={() => setK(id)} className={"px-3 py-1.5 rounded-lg text-sm font-semibold transition " + (k === id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>{n}</button>)}</div>
        <Code>{ops[k][2]}</Code>
        <Card className="font-mono text-sm">shape = ({im.h}, {im.w}, {k === "gray" ? "1 canal" : 3}) <span className="text-slate-400">— démo à échelle réduite (64×48)</span></Card>
      </div>
      <div className="flex flex-col items-center"><div className="h-72 flex items-center"><Cv data={im.d} w={im.w} h={im.h} s={s} /></div><Lbl>{ops[k][0]}</Lbl></div>
    </div>
  );
}

function S9() {
  const [cx, setX] = useState(20), [cy, setY] = useState(8);
  const res = useMemo(() => resz(base, 32, 32), []), cr = useMemo(() => crop(base, cx, cy, 32, 32), [cx, cy]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 justify-center items-start">
        <div><div className="relative"><Cv data={base.d} w={64} h={48} s={4} /><div className="absolute border-4 border-amber-400 rounded" style={{ left: cx * 4, top: cy * 4, width: 128, height: 128 }} /></div><Lbl>Originale (4:3)</Lbl></div>
        <div><Cv data={res.d} w={32} h={32} s={4} /><Lbl>Resize → carré (224×224), déformée</Lbl></div>
        <div><Cv data={cr.d} w={32} h={32} s={4} /><Lbl>Crop (zone choisie)</Lbl></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="space-y-2 text-sm">
          {[["x", cx, setX, 32], ["y", cy, setY, 16]].map(([n, v, f, m]) => <label key={n} className="flex items-center gap-3 font-mono">{n}={v}<input type="range" min="0" max={m} value={v} onChange={(e) => f(+e.target.value)} className="flex-1" /></label>)}
          <Code>{`cropped = image[${cy}:${cy + 32}, ${cx}:${cx + 32}]  # [y1:y2, x1:x2]`}</Code>
        </Card>
        <Card className="text-sm space-y-1"><p><b>Resize</b> : garde tout le contenu mais change les proportions (déformation).</p><p><b>Crop</b> : garde les pixels d'origine, mais perd tout ce qui est hors de la zone.</p><p className="text-slate-500">Démo en 64×48 ; mêmes principes avec une vraie photo.</p></Card>
      </div>
    </div>
  );
}

function S10() {
  const steps = [["Chargement", "(H, W, 3)", "uint8 · BGR"], ["Conversion RGB", "(H, W, 3)", "uint8 · RGB"], ["Resize", "(224, 224, 3)", "uint8"], ["Tableau NumPy", "(224, 224, 3)", "uint8 → float32"], ["Normalisation", "(224, 224, 3)", "float32 · [0, 1]"], ["Tenseur", "(1, 224, 224, 3)", "float32 · batch"]];
  const [i, setI] = useState(0), [v, setV] = useState(127);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">{steps.map(([n], k) => <div key={n} className="flex items-center gap-2"><button onClick={() => setI(k)} className={"px-3 py-2 rounded-xl text-sm font-semibold transition " + (k <= i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}>{k + 1}. {n}</button>{k < 5 && <ArrowRight size={16} className="text-slate-400" />}</div>)}</div>
      <Card className="font-mono text-sm flex gap-6 flex-wrap"><span>étape : <b>{steps[i][0]}</b></span><span>shape : <b>{steps[i][1]}</b></span><span>type : <b>{steps[i][2]}</b></span></Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="space-y-2">
          <table className="w-full text-sm font-mono text-center"><thead><tr className="text-slate-500"><td>uint8</td><td>float32</td></tr></thead><tbody>{[[0, "0.0"], [127, "0.498"], [255, "1.0"]].map(([a, b]) => <tr key={a} className="border-t"><td className="py-1">{a}</td><td>{b}</td></tr>)}</tbody></table>
          <label className="flex items-center gap-3 font-mono text-sm">valeur {v}<input type="range" min="0" max="255" value={v} onChange={(e) => setV(+e.target.value)} className="flex-1" /></label>
          <div className="font-mono text-sm bg-amber-50 rounded-lg p-2">{v} / 255.0 = <b>{(v / 255).toFixed(3)}</b></div>
        </Card>
        <div className="space-y-2"><Code>{`image = cv2.resize(image, (224, 224))\nimage = image.astype("float32") / 255.0`}</Code>
          <Card className="text-sm text-slate-700">La normalisation <b>dépend du modèle</b> : [0,1], [-1,1] ou moyenne/écart-type ImageNet. Utilisez toujours celle de votre modèle.</Card></div>
      </div>
    </div>
  );
}

function S11() {
  const [k, setK] = useState(0.5);
  const a = 30 * k * Math.PI / 180, b = 1 + 0.6 * k, z = 1 + 0.8 * k;
  const vars = useMemo(() => [
    ["Originale", scene],
    ["Flip horizontal", (u, v) => scene(1 - u, v)],
    [`Rotation ${Math.round(30 * k)}°`, (u, v) => { const x = u - 0.5, y = v - 0.5; return scene(x * Math.cos(a) + y * Math.sin(a) + 0.5, -x * Math.sin(a) + y * Math.cos(a) + 0.5); }],
    [`Luminosité ×${b.toFixed(2)}`, (u, v) => scene(u, v).map((c) => cl(c * b))],
    [`Zoom ×${z.toFixed(2)}`, (u, v) => scene(0.5 + (u - 0.5) / z, 0.5 + (v - 0.5) / z)],
    ["Crop aléatoire", (u, v) => scene(0.05 + k * 0.2 + u * 0.7, 0.15 + k * 0.15 + v * 0.7)],
    ["Variation couleur", (u, v) => { const c = scene(u, v); return [cl(c[0] * (1 + 0.3 * k)), c[1], cl(c[2] * (1 - 0.4 * k))]; }],
  ], [k]);
  const data = useMemo(() => vars.map(([, f]) => getData(48, 48, f)), [vars]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 justify-items-center">
        {vars.map(([n], i) => <div key={n}><Cv data={data[i]} w={48} h={48} s={3} /><Lbl>{n}</Lbl></div>)}
        <Card className="text-xs text-slate-700 w-full"><b className="text-amber-600">Attention :</b> préserver le sens. Un flip vertical sur un « 6 » donne un « 9 » ; une teinte extrême peut changer la classe (banane verte ≠ jaune).</Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card><label className="flex items-center gap-3 text-sm font-semibold">Intensité {Math.round(k * 100)}%<input type="range" min="0" max="1" step="0.05" value={k} onChange={(e) => setK(+e.target.value)} className="flex-1" /></label></Card>
        <Card className="text-sm text-slate-700">Chaque variante est un <b>nouvel exemple</b> du même objet : le modèle voit plus de diversité, ce qui réduit le surapprentissage et améliore la généralisation.</Card>
      </div>
    </div>
  );
}

function S12() {
  const [sel, setSel] = useState(5);
  const { x, y } = xy(sel, 4), idx = (y * 4 + x) * 3, below = y < 3 ? ((y + 1) * 4 + x) * 3 : -1;
  const flat = d4.flatMap((p) => p);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Card className="text-center font-mono"><div className="text-xs text-slate-500">Image</div>224×224×3</Card><Arrow />
        <Card className="text-center font-mono"><div className="text-xs text-slate-500">Flatten</div>224×224×3 = <b className="text-rose-600">{fmt(224 * 224 * 3)}</b></Card><Arrow />
        <Card className="text-center font-mono"><div className="text-xs text-slate-500">Dense(128)</div>128 neurones</Card>
      </div>
      <div className="grid md:grid-cols-3 gap-4 items-start">
        <div className="flex flex-col items-center"><Grid d={d4} n={4} cell={56} sel={sel} onSel={setSel} /><Lbl>Mini-image 4×4×3 — cliquez</Lbl></div>
        <div className="md:col-span-2 space-y-2">
          <div className="flex flex-wrap gap-0.5">{flat.map((v, i) => <div key={i} title={`index ${i}`} className={"w-5 h-5 rounded-sm text-[8px] flex items-center justify-center font-mono " + ([0, 1, 2].some((o) => idx + o === i) ? "bg-amber-400 text-black" : below >= 0 && [0, 1, 2].some((o) => below + o === i) ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-500")}>{i}</div>)}</div>
          <Card className="text-sm space-y-1"><p>Vecteur de 48 valeurs : le pixel (x={x}, y={y}) occupe les indices <b className="text-amber-600">{idx}–{idx + 2}</b>.</p>
            {below >= 0 && <p>Son voisin du dessous est aux indices <b className="text-sky-600">{below}–{below + 2}</b> : <b>{below - idx} positions</b> plus loin (largeur×3).</p>}
            <p className="text-slate-600">Le Dense ne « sait » pas que ces valeurs étaient voisines : structure 2D perdue, pas d'invariance à la translation, énorme nombre de poids.</p></Card>
        </div>
      </div>
    </div>
  );
}

function S13() {
  const inp = Array.from({ length: 36 }, (_, i) => (i % 6 < 3 ? 9 : 0));
  const K = [1, 0, -1, 1, 0, -1, 1, 0, -1];
  const out = Array.from({ length: 16 }, (_, o) => { const ox = o % 4, oy = Math.floor(o / 4); let s = 0; for (let j = 0; j < 9; j++) s += inp[(oy + Math.floor(j / 3)) * 6 + ox + (j % 3)] * K[j]; return s; });
  const [st, setSt] = useState(1);
  const ox = st % 4, oy = Math.floor(st / 4);
  const hi = Array.from({ length: 9 }, (_, j) => (oy + Math.floor(j / 3)) * 6 + ox + (j % 3));
  const g = inp.map((v) => { const c = Math.round(255 - v * 25); return [c, c, c]; });
  const fm = out.map((v, i) => (i <= st ? [255 - Math.min(255, v * 9), 255 - Math.min(255, v * 9), 255] : [226, 232, 240]));
  const chart = [{ n: "Dense 150528→128", v: 19267712 }, { n: "Conv 3×3×3 (1 filtre)", v: 28 }];
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="text-center"><div className="text-xs text-slate-500">ANN · Dense</div><div className="font-mono text-sm">150528×128+128 = <b className="text-rose-600">{fmt(19267712)}</b></div></Card>
        <Card className="text-center"><div className="text-xs text-slate-500">CNN · filtre RGB 3×3</div><div className="font-mono text-sm">3×3×3+1 = <b className="text-emerald-600">28</b> paramètres</div></Card>
      </div>
      <div className="grid md:grid-cols-3 gap-4 items-center">
        <div className="flex flex-col items-center"><Grid d={g} n={6} cell={34} hi={hi} vals={(p) => Math.round((255 - p[0]) / 25)} /><Lbl>Entrée 6×6 (bord vertical)</Lbl></div>
        <div className="flex flex-col items-center gap-2"><Grid d={K.map((v) => [v > 0 ? 180 : v < 0 ? 80 : 130, 130, 130])} n={3} cell={34} vals={(p, i) => K[i]} /><Lbl>Filtre 3×3 (poids partagés)</Lbl>
          <input type="range" min="0" max="15" value={st} onChange={(e) => setSt(+e.target.value)} className="w-40" />
          <div className="font-mono text-xs">somme = <b>{out[st]}</b></div></div>
        <div className="flex flex-col items-center"><Grid d={fm} n={4} cell={44} sel={st} vals={(p, i) => (i <= st ? out[i] : "")} /><Lbl>Feature map 4×4</Lbl></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 items-center">
        <div className="h-24"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} layout="vertical" margin={{ right: 70 }}><XAxis type="number" scale="log" domain={[1, 100000000]} hide /><YAxis type="category" dataKey="n" width={140} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="v" radius={4}><Cell fill="#e11d48" /><Cell fill="#10b981" /><LabelList dataKey="v" position="right" formatter={fmt} style={{ fontSize: 11 }} /></Bar></BarChart></ResponsiveContainer></div>
        <Card className="text-xs text-slate-700">Le <b>même filtre</b> glisse sur toute l'image (partage des poids) et détecte un <b>motif local</b> (ici un bord vertical) où qu'il soit. Échelle logarithmique.</Card>
      </div>
    </div>
  );
}

function S14() {
  const flow = ["Image", "OpenCV", "NumPy", "Prétraitement", "Tenseur", "CNN", "Classification"];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">{flow.map((f, i) => <div key={f} className="flex items-center gap-2"><span className={"px-3 py-2 rounded-xl text-sm font-bold " + (i === 5 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-700")}>{f}</span>{i < 6 && <ArrowRight size={16} className="text-slate-400" />}</div>)}</div>
      <div className="grid md:grid-cols-2 gap-4">
        <Code>{`import cv2\nimport numpy as np\n\nimage = cv2.imread("image.jpg")\nif image is None:\n    raise FileNotFoundError("image.jpg")\nimage = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)\nimage = cv2.resize(image, (224, 224))\nimage = image.astype("float32") / 255.0\nbatch = np.expand_dims(image, axis=0)\nprint(batch.shape, batch.dtype)\n# (1, 224, 224, 3) float32`}</Code>
        <div className="space-y-2 text-sm">
          {["Image = tenseur H×W×C de valeurs numériques", "OpenCV lit en BGR : convertir en RGB si besoin", "Resize, normalisation et format (NHWC / NCHW) selon le modèle", "Data augmentation : variantes qui préservent le sens", "Flatten détruit la structure spatiale ; la convolution la respecte"].map((t) => <Card key={t} className="py-2">✓ {t}</Card>)}
        </div>
      </div>
      <div className="rounded-2xl bg-indigo-600 text-white p-5 text-center text-xl font-semibold shadow-lg">Pourquoi un CNN est-il généralement mieux adapté qu'un ANN classique pour reconnaître des objets dans une image ?</div>
    </div>
  );
}

const SLIDES = [
  [null, S1],
  ["Comment un ordinateur comprend-il une image ?", S2],
  ["Anatomie d'une image", S3],
  ["RGB, BGR et Grayscale", S4],
  ["Image et NumPy", S5],
  ["Comprendre les tenseurs", S6],
  ["Introduction à OpenCV", S7],
  ["Manipulations d'images", S8],
  ["Comparaison Resize et Crop", S9],
  ["Image Preprocessing", S10],
  ["Data Augmentation", S11],
  ["ANN et Flatten", S12],
  ["Explosion des paramètres & introduction aux CNN", S13],
  ["Conclusion et bonnes pratiques", S14],
];

export default function Presentation() {
  const [i, setI] = useState(0);
  const go = (d) => setI((v) => Math.max(0, Math.min(SLIDES.length - 1, v + d)));
  useEffect(() => {
    const h = (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const [title, Comp] = SLIDES[i];
  return (
    <div className="min-h-screen flex flex-col text-slate-800" style={{ backgroundColor: "#f8fafc", backgroundImage: "linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)", backgroundSize: "32px 32px" }}>
      <style>{"@keyframes fi{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.fi{animation:fi .45s ease both}"}</style>
      <div className="h-1.5 bg-slate-200"><div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: ((i + 1) / SLIDES.length) * 100 + "%" }} /></div>
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col">
        {title && <h2 className="flex items-center gap-3 text-3xl font-extrabold mb-5"><span className="w-10 h-10 rounded-xl bg-indigo-600 text-white text-lg flex items-center justify-center">{i + 1}</span>{title}</h2>}
        <div key={i} className="fi flex-1"><Comp /></div>
      </main>
      <footer className="max-w-6xl w-full mx-auto px-6 pb-5 flex items-center justify-between">
        <button onClick={() => go(-1)} disabled={i === 0} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm font-semibold disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={18} />Précédent</button>
        <div className="text-sm font-mono text-slate-500">{i + 1} / {SLIDES.length}</div>
        <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 text-white shadow font-semibold disabled:opacity-40 hover:bg-indigo-700">Suivant<ChevronRight size={18} /></button>
      </footer>
    </div>
  );
}
