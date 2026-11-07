#!/usr/bin/env python3
"""Empaqueta src/ en un único HTML (dist/altozano.html) listo para publicar como Artifact.
Uso: python3 tools/build.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
html = (src / 'index.html').read_text(encoding='utf-8')
html = '\n'.join(l for l in html.split('\n') if '<!--dev-only-->' not in l)
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">',
              lambda m: '<style>\n' + (src / m.group(1)).read_text(encoding='utf-8') + '</style>', html)
js = []
def take(m):
    js.append((src / m.group(1)).read_text(encoding='utf-8'))
    return ''
html = re.sub(r'<script src="(js/[^"]+)"></script>\n?', take, html)
html = html.rstrip() + '\n<script>\n(()=>{\n' + '\n'.join(js) + '})();\n</script>\n'
out = root / 'dist' / 'altozano.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'OK {out} ({len(html)//1024} KB)')
