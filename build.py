# Đóng gói dự án thành 1 file HTML chạy độc lập: python3 build.py
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css/style.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    return '<script>\n' + (root / m.group(1)).read_text(encoding='utf-8') + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
out = root / 'dist'; out.mkdir(exist_ok=True)
(out / 'rung-dem.html').write_text(html, encoding='utf-8')
print('built', out / 'rung-dem.html', len(html), 'bytes')
