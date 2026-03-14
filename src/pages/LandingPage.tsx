import React, { useEffect, useRef } from 'react';

interface LandingPageProps {
    onStart: () => void;
}

const features = [
    { icon: '📝', title: 'Multi-Tab Editor', desc: 'Open multiple files simultaneously with a familiar tabbed interface, just like the desktop Notepad++.' },
    { icon: '🎨', title: 'Syntax Highlighting', desc: 'Full Monaco editor (VS Code engine) with syntax highlighting for 20+ languages — JS, TS, Python, Java, SQL and more.' },
    { icon: '☁️', title: 'Google Drive Sync', desc: 'Sign in with Google to automatically back up and sync your files to Google Drive. Access them from any device.' },
    { icon: '📁', title: 'Workspaces', desc: 'Organise files into workspaces. Each workspace maps to its own Google Drive folder, keeping projects separate.' },
    { icon: '🔍', title: 'Find & Replace', desc: 'Powerful find and replace with regex support, case sensitivity, and whole-word matching built right in.' },
    { icon: '⚖️', title: 'File Compare', desc: 'Side-by-side diff view to compare any two files. See additions, deletions, and changes highlighted instantly.' },
    { icon: '🌙', title: 'Dark & Light Theme', desc: 'Comfortable coding day or night. Switch between dark and light themes in one click — your preference is saved.' },
    { icon: '💾', title: 'Works Offline', desc: 'All your files are stored locally in your browser — no internet required to create, edit, or read your notes.' },
];

// Exact palette from the VSCode-dark editor theme
const C = {
    bg:       '#1e1e1e',
    panel:    '#252526',
    border:   '#3c3c3c',
    text:     '#e0e0e0',
    textDim:  '#888',
    textMute: '#555',
    accent:   '#007acc',
    accentHi: '#1a9ed4',
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animId: number;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);
        const dots = Array.from({ length: 70 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 1.1 + 0.3,
            speed: Math.random() * 0.2 + 0.04,
            alpha: Math.random(),
        }));
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            dots.forEach((d) => {
                d.alpha += d.speed * 0.012;
                if (d.alpha > 1) { d.alpha = 0; d.x = Math.random() * canvas.width; d.y = Math.random() * canvas.height; }
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,122,204,${d.alpha * 0.3})`;
                ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    const btnPrimary: React.CSSProperties = {
        padding: '12px 32px', fontSize: 14, fontWeight: 700,
        border: 'none', borderRadius: 5, cursor: 'pointer',
        background: C.accent, color: '#fff',
        transition: 'background 0.15s',
    };
    const btnSecondary: React.CSSProperties = {
        padding: '12px 32px', fontSize: 14, fontWeight: 600,
        border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer',
        background: 'transparent', color: C.textDim,
        transition: 'border-color 0.15s, color 0.15s',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: C.bg, overflowY: 'auto', fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* ── HERO ── */}
                <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 72px', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 22, boxShadow: `0 0 36px ${C.accent}55` }}>
                        📝
                    </div>

                    <h1 style={{ fontSize: 'clamp(1.9rem, 5.5vw, 3.4rem)', fontWeight: 800, margin: '0 0 10px', color: C.text, lineHeight: 1.15 }}>
                        NextNotePad<span style={{ color: C.accent }}>.com</span>
                    </h1>

                    <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.15rem)', color: C.textDim, maxWidth: 500, margin: '0 0 40px', lineHeight: 1.65 }}>
                        A fast, browser-based code editor with Google Drive sync, workspaces, syntax highlighting — completely free.
                    </p>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button style={btnPrimary} onClick={onStart}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = C.accentHi; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent; }}>
                            🚀 Start Code Editor
                        </button>
                        <button style={btnSecondary} onClick={onStart}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.textDim; (e.currentTarget as HTMLElement).style.color = C.text; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textDim; }}>
                            Try without signing in
                        </button>
                    </div>

                    {/* Editor mockup */}
                    <div style={{ marginTop: 52, width: '100%', maxWidth: 760, borderRadius: 6, border: `1px solid ${C.border}`, background: C.panel, overflow: 'hidden', boxShadow: '0 16px 56px rgba(0,0,0,0.7)' }}>
                        {/* Window bar */}
                        <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, background: '#2d2d2d', borderBottom: `1px solid ${C.border}` }}>
                            {['#ff5f57','#febc2e','#28c840'].map((col, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: col }} />)}
                            <span style={{ marginLeft: 8, fontSize: 11, color: C.textMute }}>main.ts — NextNotePad.com</span>
                        </div>
                        {/* Tabs */}
                        <div style={{ display: 'flex', background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 6px' }}>
                            {['main.ts', 'utils.py', 'styles.css'].map((t, i) => (
                                <div key={t} style={{ padding: '6px 14px', fontSize: 12, color: i === 0 ? C.text : C.textMute, borderBottom: i === 0 ? `2px solid ${C.accent}` : '2px solid transparent', background: i === 0 ? C.panel : 'transparent', cursor: 'default' }}>{t}</div>
                            ))}
                        </div>
                        {/* Code lines */}
                        <div style={{ padding: '12px 16px', fontFamily: "'Fira Code','Courier New',monospace", fontSize: 12.5, lineHeight: 1.85, userSelect: 'none', textAlign: 'left' }}>
                            {([
                                <><span style={{color:'#569cd6'}}>interface </span><span style={{color:'#4ec9b0'}}>Workspace </span><span style={{color:C.text}}>{'{'}</span></>,
                                <><span style={{display:'inline-block',paddingLeft:20}}><span style={{color:'#9cdcfe'}}>id</span><span style={{color:C.text}}>: </span><span style={{color:'#569cd6'}}>string</span><span style={{color:C.text}}>;</span></span></>,
                                <><span style={{display:'inline-block',paddingLeft:20}}><span style={{color:'#9cdcfe'}}>name</span><span style={{color:C.text}}>: </span><span style={{color:'#569cd6'}}>string</span><span style={{color:C.text}}>;</span></span></>,
                                <><span style={{display:'inline-block',paddingLeft:20}}><span style={{color:'#9cdcfe'}}>driveId</span><span style={{color:C.text}}>?: </span><span style={{color:'#569cd6'}}>string</span><span style={{color:C.text}}>;</span></span></>,
                                <><span style={{color:C.text}}>{'}'}</span></>,
                                <>&nbsp;</>,
                                <><span style={{color:'#569cd6'}}>function </span><span style={{color:'#dcdcaa'}}>syncToDrive</span><span style={{color:C.text}}>(ws: </span><span style={{color:'#4ec9b0'}}>Workspace</span><span style={{color:C.text}}>) {'{'}</span></>,
                                <><span style={{display:'inline-block',paddingLeft:20}}><span style={{color:'#c586c0'}}>return </span><span style={{color:'#dcdcaa'}}>uploadFolder</span><span style={{color:C.text}}>(ws.</span><span style={{color:'#9cdcfe'}}>driveId</span><span style={{color:C.text}}>);</span></span></>,
                                <><span style={{color:C.text}}>{'}'}</span></>,
                            ] as React.ReactNode[]).map((line, i) => (
                                <div key={i} style={{ display: 'flex', gap: 14 }}>
                                    <span style={{ color: C.textMute, minWidth: 16, textAlign: 'right', fontSize: 11, flexShrink: 0 }}>{i + 1}</span>
                                    <span>{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: 44, color: C.textMute, fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span>Explore features</span>
                        <span style={{ fontSize: 15, animation: 'bounce 1.5s ease-in-out infinite' }}>↓</span>
                    </div>
                </section>

                {/* ── FEATURES ── */}
                <section style={{ padding: '64px 24px 80px', background: C.panel, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                    <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.3rem, 3.5vw, 1.9rem)', fontWeight: 700, margin: '0 0 6px', color: C.text }}>
                        Everything you need to code in your browser
                    </h2>
                    <p style={{ textAlign: 'center', color: C.textDim, margin: '0 0 44px', fontSize: 13 }}>No installation. No setup. Just open and start coding.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, maxWidth: 1020, margin: '0 auto' }}>
                        {features.map((f) => (
                            <div key={f.title}
                                style={{ padding: '22px 18px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, transition: 'border-color 0.15s, transform 0.15s' }}
                                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = ''; }}
                            >
                                <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                                <h3 style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: C.text }}>{f.title}</h3>
                                <p style={{ margin: 0, fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── BOTTOM CTA ── */}
                <section style={{ padding: '64px 24px 80px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 700, margin: '0 0 8px', color: C.text }}>Ready to start coding?</h2>
                    <p style={{ color: C.textDim, margin: '0 0 28px', fontSize: 13 }}>Sign in with Google to sync your files, or just dive in — no account needed.</p>
                    <button style={{ ...btnPrimary, padding: '13px 42px', fontSize: 15 }} onClick={onStart}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = C.accentHi; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent; }}>
                        🚀 Launch Editor
                    </button>
                    <p style={{ marginTop: 20, fontSize: 11, color: C.textMute }}>Your files are always stored locally — private by default.</p>
                </section>
            </div>

            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }`}</style>
        </div>
    );
};

export default LandingPage;
