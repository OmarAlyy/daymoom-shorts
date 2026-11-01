#!/usr/bin/env python3
"""Original soundtrack for one video, synthesized from its spec (no samples, no licences).

    python3 tools/sound.py src/videos/01-streak-broke.json

Reads the same JSON the Remotion composition renders, so music and SFX land on
the exact beats. Writes public/audio/<id>.wav, mastered to -14 LUFS integrated,
true peak <= -1.5 dBTP (two-pass ffmpeg loudnorm).

The Balloon's voice is NOT here yet (engine not chosen). When it is, the voice
track gets mixed on top and the bed ducks under it; see README.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def tone(f, dur, tau, harm=(1.0, 0.25, 0.08), attack=0.004):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harm))
    e = env_exp(n, tau)
    a = min(n, int(attack * SR))
    e[:a] *= np.linspace(0, 1, a)
    return s * e


def lowpass(x, cutoff):
    # one-pole low-pass, cutoff may be an array (sweeps)
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def add(buf, at, sig, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += gain * sig[: j - i]


# ---------------------------------------------------------------- SFX
def sfx(kind):
    if kind == 'pop':
        n = int(0.09 * SR); t = np.arange(n) / SR
        f = 700 * np.exp(-t * 18) + 180
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.025) * 0.9
    if kind == 'tick':
        return tone(2400, 0.04, 0.006, harm=(1.0,)) * 0.5
    if kind == 'ding':
        return (tone(midi(88), 1.2, 0.35, harm=(1, 0.0, 0.12)) + 0.5 * tone(midi(95), 1.2, 0.25, harm=(1,))) * 0.45
    if kind == 'bell':
        a = tone(midi(84), 0.7, 0.18, harm=(1, 0.3, 0.2)) * 0.5
        out = np.zeros(int(1.0 * SR)); add(out, 0, a); add(out, 0.18, a, 0.8); return out
    if kind == 'chime':
        out = np.zeros(int(1.4 * SR))
        for k, n in enumerate((79, 83, 86)):
            add(out, k * 0.07, tone(midi(n), 1.2, 0.3, harm=(1, 0, 0.1)), 0.35)
        return out
    if kind == 'whoosh':
        n = int(0.42 * SR); x = rng.standard_normal(n)
        sweep = np.linspace(300, 3500, n) ** 1.0
        e = np.sin(np.linspace(0, np.pi, n)) ** 2
        return lowpass(x, sweep) * e * 0.35
    if kind == 'thud':
        n = int(0.3 * SR); t = np.arange(n) / SR
        f = 120 * np.exp(-t * 10) + 55
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.08) * 0.9
    if kind == 'deflate':
        n = int(1.0 * SR); t = np.arange(n) / SR
        f = 520 * np.exp(-t * 1.6) + 140 + 14 * np.sin(2 * np.pi * 9 * t)
        air = lowpass(rng.standard_normal(n), 1800) * 0.25
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + air) * np.minimum(1, (1 - t) * 3) * np.minimum(1, t * 30)
    if kind == 'inflate':
        n = int(0.75 * SR); t = np.arange(n) / SR
        f = 180 + 420 * (t / t[-1]) ** 1.3
        air = lowpass(rng.standard_normal(n), np.linspace(500, 3000, n)) * 0.3
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + air) * np.sin(np.linspace(0, np.pi, n)) ** 0.6
    if kind == 'squeak':
        # rubbery balloon squeak: fast wobble around 1 kHz
        n = int(0.16 * SR); t = np.arange(n) / SR
        f = 950 + 260 * np.sin(2 * np.pi * 34 * t) + 300 * t / t[-1]
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, n)) * 0.35
    if kind == 'puff':
        n = int(0.22 * SR)
        return lowpass(rng.standard_normal(n), 1400) * env_exp(n, 0.05) * 0.9
    if kind == 'sparkle':
        out = np.zeros(int(0.7 * SR))
        for k, nn in enumerate((96, 100, 103)):
            add(out, k * 0.045, tone(midi(nn), 0.5, 0.12, harm=(1,)), 0.25)
        return out
    raise ValueError(kind)


# ---------------------------------------------------------------- music bed
KEYS = {'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 57, 'B': 59}
MAJOR = [(0, 4, 7, 11), (9, 12, 16, 19), (5, 9, 12, 16), (7, 11, 14, 17)]  # Imaj7 vi IV V
MINOR = [(0, 3, 7, 10), (8, 12, 15, 19), (3, 7, 10, 14), (10, 14, 17, 21)]  # i VI III VII


def music(spec, total):
    m = spec['music']
    bpm, root = m['bpm'], KEYS[m['key']]
    beat = 60 / bpm
    bar = 4 * beat
    sections = m['sections']

    def mood_at(x):
        cur = sections[0]['mood']
        for sct in sections:
            if sct['at'] <= x + 1e-6:
                cur = sct['mood']
        return cur
    out = np.zeros(int(total * SR) + SR)
    # chords change every 2 beats so a mood switch lands close to its cue
    step = 2 * beat
    nsteps = int(total / step) + 2
    for b in range(nsteps):
        t0 = b * step
        mood = mood_at(t0)
        prog = MINOR if mood == 'minor' else MAJOR
        ch = prog[(b // 2) % 4]
        # pad: soft triangle-ish chord, slow attack
        minor = mood == 'minor'
        for iv in ch:
            n = int(step * SR)
            tt = np.arange(n) / SR
            f = midi(root + iv - (12 if minor else 0))
            s = np.sin(2 * np.pi * f * tt) + 0.15 * np.sin(2 * np.pi * 2 * f * tt)
            e = np.minimum(1, tt / 0.3) * np.minimum(1, (step - tt) / 0.2)
            add(out, t0, s * e, 0.045 if minor else 0.035)
        add(out, t0, tone(midi(root - 12 + ch[0]), beat * 1.8, 0.5, harm=(1, 0.3)), 0.16)
        if minor:
            # sparse: one low note per step, no drums
            add(out, t0 + beat, tone(midi(root + ch[2]), 0.9, 0.35, harm=(1, 0, 0.1)), 0.05)
            continue
        pattern = [0, 2, 1, 3]
        for k, p in enumerate(pattern):
            add(out, t0 + k * beat / 2, tone(midi(root + 12 + ch[p % 4]), 0.5, 0.11, harm=(1, 0, 0.18)), 0.06 + 0.02 * (k % 2 == 0))
        if t0 >= beat * 2:
            for k in range(2):
                add(out, t0 + k * beat, sfx('thud')[: int(0.18 * SR)], 0.12 if (b * 2 + k) % 2 == 0 else 0.0)
                sh = lowpass(rng.standard_normal(int(0.05 * SR)), 6000) * env_exp(int(0.05 * SR), 0.012)
                add(out, t0 + k * beat + beat / 2, sh, 0.05)
    # gentle fade in on frame 1 (no silence) and out under the end card
    n = len(out)
    out[: int(0.05 * SR)] *= np.linspace(0.3, 1, int(0.05 * SR))
    fo = int(1.2 * SR)
    end = int(total * SR)
    out[end - fo:end] *= np.linspace(1, 0.25, fo)
    out[end:] = 0
    return out


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())


def loudnorm(src, dst):
    # two-pass EBU R128 to -14 LUFS, TP -1.5
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    js = p.stderr[p.stderr.rfind('{'):p.stderr.rfind('}') + 1]
    st = json.loads(js)
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={st['input_i']}:measured_TP={st['input_tp']}:"
          f"measured_LRA={st['input_lra']}:measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-af', af + ',alimiter=limit=0.84:level=false', '-ar', str(SR), dst], check=True)


def main(path):
    spec = json.load(open(path))
    total = spec['durationSec']
    mix = music(spec, total)
    for e in spec['sfx']:
        gain = {'pop': 0.5, 'tick': 0.4, 'ding': 0.6, 'bell': 0.55, 'chime': 0.5, 'whoosh': 0.45, 'thud': 0.5, 'deflate': 0.6, 'inflate': 0.6,
                'squeak': 0.4, 'puff': 0.55, 'sparkle': 0.45}[e['type']]
        add(mix, e['at'], sfx(e['type']), gain)
    mix = mix[: int(total * SR)]
    os.makedirs('public/audio', exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, 'raw.wav')
        write_wav(raw, mix / max(1e-9, np.abs(mix).max()) * 0.7)
        loudnorm(raw, f"public/audio/{spec['id']}.wav")
    print('wrote', f"public/audio/{spec['id']}.wav")


if __name__ == '__main__':
    for p in sys.argv[1:]:
        main(p)
