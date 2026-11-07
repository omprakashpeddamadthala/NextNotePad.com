"""Original royalty-free backing track for the promo (synthesised, no samples).

usage: python3 music.py out.wav 45
120 BPM, Am - F - C - G, pad + bass + pluck arpeggio + light drums.
"""
import sys
import wave

import numpy as np

SR = 48000
out_path = sys.argv[1]
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 45.0
n = int(SR * dur)
t = np.arange(n) / SR
BEAT = 0.5  # 120 BPM
BAR = BEAT * 4
mix = np.zeros(n)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G


def env(length, a, r):
    e = np.ones(length)
    ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai)
    e[-ri:] *= np.linspace(1, 0, ri)
    return e


def add(sig, start):
    i = int(start * SR)
    j = min(n, i + len(sig))
    if i < n:
        mix[i:j] += sig[: j - i]


bars = int(np.ceil(dur / BAR))
rng = np.random.default_rng(7)
for b in range(bars):
    chord = CHORDS[b % 4]
    s = b * BAR
    L = int(BAR * SR)
    tt = np.arange(L) / SR
    # pad: detuned saw-ish (few harmonics)
    pad = np.zeros(L)
    for m in chord:
        for det in (-0.12, 0.12):
            f = hz(m + 12) * 2 ** (det / 12)
            for h in range(1, 5):
                pad += np.sin(2 * np.pi * f * h * tt) / (h * 1.6)
    add(pad * env(L, 0.25, 0.3) * 0.018, s)
    # bass: root on each beat, plucky
    for k in range(4):
        BL = int(BEAT * SR)
        bt = np.arange(BL) / SR
        f = hz(chord[0] - 12)
        bass = (np.sin(2 * np.pi * f * bt) + 0.3 * np.sin(4 * np.pi * f * bt)) * np.exp(-bt * 5)
        add(bass * 0.16, s + k * BEAT)
    # pluck arpeggio in 8ths (starts after the hook)
    if s >= 3.5:
        notes = chord + [chord[1] + 12, chord[2], chord[0] + 12, chord[1], chord[2] + 12]
        for k, m in enumerate(notes):
            PL = int(0.4 * SR)
            pt = np.arange(PL) / SR
            f = hz(m + 12)
            pl = (np.sin(2 * np.pi * f * pt) + 0.4 * np.sin(4 * np.pi * f * pt)) * np.exp(-pt * 9)
            add(pl * 0.05, s + k * BEAT / 2)
    # drums
    for k in range(4):
        bs = s + k * BEAT
        KL = int(0.3 * SR)
        kt = np.arange(KL) / SR
        kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 9)
        add(kick * 0.45, bs)
        if s >= 3.5:
            HL = int(0.06 * SR)
            hat = rng.standard_normal(HL) * np.exp(-np.arange(HL) / SR * 70)
            hat = np.diff(hat, prepend=0)  # crude high-pass
            add(hat * 0.04, bs + BEAT / 2)
        if k in (1, 3) and s >= 7:
            CL = int(0.18 * SR)
            ct = np.arange(CL) / SR
            clap = rng.standard_normal(CL) * np.exp(-ct * 22)
            add(clap * 0.08, bs)

# fade in / out, normalise to -1 dBFS
fade_in, fade_out = int(0.05 * SR), int(2.0 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)
mix[-fade_out:] *= np.linspace(1, 0, fade_out)
mix = np.tanh(mix * 1.2)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
pcm = (mix * 32767).astype(np.int16)
stereo = np.repeat(pcm[:, None], 2, axis=1)

with wave.open(out_path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("wrote", out_path)
